import {AnyObject, repository} from '@loopback/repository';
import {param, get} from '@loopback/rest';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {SecurityBindings} from '@loopback/security';
import {inject} from '@loopback/core';

import {SubscriptionRepository, UserRepository} from '../repositories';
import {calculatePercentage, setValidDate, isFirstElementGreater} from './utils/helpers';
import {
  SECURITY_SPEC_KC_PASSWORD,
  Roles,
  SUBSCRIPTION_STATUS,
  IDashboardCitizen,
  IDashboardCitizenIncentiveList,
  IDashboardSubscription,
  IDashboardSubscriptionResult,
  StatusCode,
  AUTH_STRATEGY,
} from '../utils';
import {IUser} from '../services';

/**
 * CONTROLLERS
 *
 *
 * dashboard controller function and api endpoints
 */
@authenticate(AUTH_STRATEGY.KEYCLOAK)
@authorize({allowedRoles: [Roles.FUNDERS]})
export class DashboardController {
  constructor(
    @repository(SubscriptionRepository)
    public subscriptionRepository: SubscriptionRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
    @inject(SecurityBindings.USER)
    private currentUser: IUser,
  ) {}

  /**
   * get the citizens for dashboard
   * @param year the filter year value
   * @param semester the filter semester value
   * @returns an object with the incentive list + citizens statistics
   */
  @get('/v1/dashboards/citizens', {
    'x-controller-name': 'Dashboards',
    summary:
      'Retourne le nombre de citoyens ayant une souscription' +
      ' validée concernant le financeur connecté',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Count of citizen with at least one validated subscription',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                incentiveList: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      incentiveId: {
                        description: `Identifiant de l'aide`,
                        type: 'string',
                        example: '',
                      },
                      incentiveTitle: {
                        description: `Titre de l'aide`,
                        type: 'string',
                        example: 'Le vélo électrique arrive à Mulhouse !',
                      },
                      totalSubscriptionsCount: {
                        description: `Nombre de souscriptions validées selon l'aide`,
                        type: 'number',
                        example: 1,
                      },
                      validatedSubscriptionPercentage: {
                        description: `Pourcentage de souscriptions validées par citoyen`,
                        type: 'number',
                        example: 25,
                      },
                    },
                  },
                },
                totalCitizensCount: {
                  description: `Nombre de citoyens ayant réalisé au moins une demande`,
                  type: 'number',
                  example: 4,
                },
              },
            },
          },
        },
      },
    },
  })
  async findCitizen(
    @param.query.string('year', {
      description: `Filtre sur l'année de validation des demandes d'aide`,
    })
    year: string,
    @param.query.string('semester', {
      description: `Filtre sur le semestre de validation des demandes d'aide`,
    })
    semester: string,
  ): Promise<IDashboardCitizen> {
    /**
     * get he user community ids list
     */
    const {id, roles, funderName, incentiveType} = this.currentUser;
    const user = await this.userRepository.findOne({where: {id}});
    const communityIds = user?.communityIds;

    /**
     * set the search query start and end dates value
     */
    const searchQueryDate = setValidDate(year, semester);
    const {startDate, endDate} = searchQueryDate;

    /**
     * define the user role persona
     */
    const isSupervisor = roles?.includes(Roles.SUPERVISORS);
    const isManager = roles?.includes(Roles.MANAGERS);

    /**
     * init a basic query search params
     */
    let withParams: object = {
      incentiveType: incentiveType,
      funderName: funderName,
      status: SUBSCRIPTION_STATUS.VALIDATED,
      updatedAt: {between: [startDate, endDate]},
    };

    /**
     * inject the communityId param when checking if the user is belonging
     * to any funder communities, for now only the user with Gestionnaire role
     * can belong to a funder community.
     * for this condition communityId with values means it's a Gestionnaire Role
     * or if communityId returns undefined that means it's a Supervisor
     */
    if (communityIds && communityIds.length > 0 && !isSupervisor && isManager) {
      withParams = {
        ...withParams,
        communityId: {inq: communityIds},
      };
    }

    /**
     * query the subscription repository
     */
    const querySubscription = await this.subscriptionRepository.find({
      where: withParams,
      fields: {
        id: true,
        incentiveId: true,
        incentiveTitle: true,
        citizenId: true,
      },
    });

    /**
     * group the subscription list by incentive id
     */
    const groupSubscriptionsByIncentive = querySubscription.reduce(
      (groups: any, item: any) => {
        const group = groups[item.incentiveId] || [];

        const found = group.some(
          (el: {citizenId: string}) => el.citizenId === item.citizenId,
        );

        if (!found) group.push(item);
        groups[item.incentiveId] = group;

        return groups;
      },
      {},
    );

    /**
     * merge all the subscriptions grouped by incentive result in one list
     */
    const newQuerySubscription: AnyObject = Object.values(
      groupSubscriptionsByIncentive,
    ).flat();

    /**
     * init new subscriptions list
     */
    const uniqueCitizensList: string[] = [];
    let incentiveList: IDashboardCitizenIncentiveList[] = [];

    /**
     * crete the subscriptions list and count unique subscriptions by citizen id
     */
    newQuerySubscription.forEach(
      (
        item: {citizenId: string; incentiveId: string; incentiveTitle: string},
        index: number,
      ) => {
        /**
         * set the new unique citizen list
         */
        const citizenIdFound = uniqueCitizensList.some(
          el => el === newQuerySubscription[index].citizenId,
        );

        if (!citizenIdFound) uniqueCitizensList.push(item.citizenId);

        /**
         * create a new demand element
         */
        const elementIndex = incentiveList.findIndex(
          (element: {incentiveId: string}) =>
            element.incentiveId.toString() === item.incentiveId.toString(),
        );

        if (elementIndex >= 0) {
          incentiveList[elementIndex].totalSubscriptionsCount =
            incentiveList[elementIndex].totalSubscriptionsCount + 1;
        } else {
          incentiveList.push({
            incentiveId: item.incentiveId,
            incentiveTitle: item.incentiveTitle,
            totalSubscriptionsCount: 1,
          } as IDashboardCitizenIncentiveList);
        }
      },
    );

    /**
     * sort the subscription list by total subscription count
     */
    incentiveList.sort(isFirstElementGreater);

    /**
     * set the percentage of validated subscription by group
     */
    incentiveList = calculatePercentage(incentiveList, uniqueCitizensList.length);

    /**
     * return subscription statistic by incentive group
     */
    return {
      incentiveList: incentiveList,
      totalCitizensCount: uniqueCitizensList.length,
    } as IDashboardCitizen;
  }

  /**
   * get the subscriptions for the dashboard
   * @param year the selected year value
   * @param semester the selected semester value
   * @returns an object with the query result + subscriptions statistics
   */
  @get('/v1/dashboards/subscriptions', {
    'x-controller-name': 'Dashboards',
    summary:
      'Retourne le nombre de souscriptions par statut concernant le financeur connecté',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Count of subscription per status',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                result: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      status: {
                        description: `Statut de la souscription`,
                        type: 'string',
                        example: SUBSCRIPTION_STATUS.TO_PROCESS,
                      },
                      count: {
                        description: `Nombre de souscriptions pour le statut`,
                        type: 'number',
                        example: 5,
                      },
                    },
                  },
                },
                totalCount: {
                  description: `Nombre de total de souscriptions tous status confondus`,
                  type: 'number',
                  example: 25,
                },
                totalPending: {
                  type: 'object',
                  properties: {
                    count: {
                      description: `Nombre de demande sur le périmètre de l'utilisateur connecté`,
                      type: 'number',
                      example: 3,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  async find(
    @param.query.string('year') year: string,
    @param.query.string('semester') semester: string,
  ): Promise<IDashboardSubscription> {
    /**
     * get he user community ids list
     */
    const {id, roles, funderName, incentiveType} = this.currentUser;
    const user = await this.userRepository.findOne({where: {id}});
    const communityIds = user?.communityIds;

    /**
     * set the search query start and end dates value
     */
    const searchQueryDate = setValidDate(year, semester);
    const {startDate, endDate} = searchQueryDate;

    /**
     * define the user role persona
     */
    const isSupervisor = roles?.includes(Roles.SUPERVISORS);
    const isManager = roles?.includes(Roles.MANAGERS);

    /**
     * init a basic query search params
     */
    let queryParams: object = {
      incentiveType: incentiveType,
      funderName: funderName,
      status: {neq: SUBSCRIPTION_STATUS.DRAFT},
      updatedAt: {between: [startDate, endDate]},
    };

    /**
     * inject the communityId param when checking if the user is belonging
     * to any funder communities, for now only the user with Gestionnaire role
     * can belong to a funder community.
     * for this condition communityId with values means it's a Gestionnaire Role
     * or if communityId returns undefined that means it's a Supervisor
     */
    if (communityIds && communityIds.length > 0 && !isSupervisor && isManager) {
      queryParams = {
        ...queryParams,
        communityId: {inq: communityIds},
      };
    }

    /**
     * query the subscription repository
     */
    const querySubscription = await this.subscriptionRepository.find({
      where: queryParams,
      fields: {
        status: true,
      },
    });

    if (communityIds && communityIds.length > 0 && isManager) {
      queryParams = {
        ...queryParams,
        status: SUBSCRIPTION_STATUS.TO_PROCESS,
        communityId: {inq: communityIds},
      };
    }

    /**
     * set the pending subscriptions count to be managed by the manager depending on his community
     */
    let totalPending = {count: 0};
    if (isManager) {
      totalPending = await this.subscriptionRepository.count(queryParams);
    }

    /**
     * group the demands query result by status and set the count of it
     */
    const newDemandsGroupList: IDashboardSubscriptionResult[] = [];
    querySubscription.map((groupEl: {status: SUBSCRIPTION_STATUS}) => {
      const elementIndex = newDemandsGroupList.findIndex(
        (element: any) => element.status === groupEl.status,
      );

      if (elementIndex >= 0) {
        newDemandsGroupList[elementIndex].count =
          newDemandsGroupList[elementIndex].count + 1;
      } else {
        newDemandsGroupList.push({
          status: groupEl.status,
          count: 1,
        });
      }
    });

    /**
     * set the global count by auditioning all the demands status count
     */
    const totalCount: number = newDemandsGroupList.reduce(
      (sum: number, currentValue: {count: number}) => {
        return sum + currentValue.count;
      },
      0,
    );

    /**
     * final result return
     */
    return {
      result: newDemandsGroupList,
      totalPending,
      totalCount,
    };
  }
}
