import * as Excel from 'exceljs';
import {inject, intercept, service} from '@loopback/core';
import {repository, AnyObject} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  put,
  patch,
  requestBody,
  Response,
  RestBindings,
  del,
} from '@loopback/rest';
import {SecurityBindings} from '@loopback/security';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';

import {
  EnterpriseRepository,
  CommunityRepository,
  UserRepository,
  SubscriptionRepository,
  IncentiveRepository,
  AffiliationRepository,
} from '../repositories';
import {
  CitizenService,
  KeycloakService,
  MailService,
  JwtService,
  FunderService,
  SubscriptionService,
  AffiliationService,
} from '../services';
import {CitizenInterceptor} from '../interceptors';
import {
  CitizenUpdate,
  Affiliation,
  Incentive,
  Citizen,
  Subscription,
  Enterprise,
  Error,
  CitizenCreate,
  User,
} from '../models';
import {ValidationError} from '../validationError';
import {
  ResourceName,
  StatusCode,
  AFFILIATION_STATUS,
  Roles,
  SUBSCRIPTION_STATUS,
  SECURITY_SPEC_API_KEY,
  SECURITY_SPEC_KC_PASSWORD,
  SECURITY_SPEC_JWT_KC_PASSWORD,
  AUTH_STRATEGY,
  Consent,
  ClientOfConsent,
  IUser,
} from '../utils';
import {canAccessHisOwnData} from '../services/user.authorizor';
import {formatDateInTimezone} from '../utils/date';

@intercept(CitizenInterceptor.BINDING_KEY)
export class CitizenController {
  constructor(
    @inject('services.MailService')
    public mailService: MailService,
    @repository(CommunityRepository)
    public communityRepository: CommunityRepository,
    @inject('services.KeycloakService')
    public keycloakService: KeycloakService,
    @inject('services.FunderService')
    public funderService: FunderService,
    @repository(EnterpriseRepository)
    public enterpriseRepository: EnterpriseRepository,
    @inject('services.CitizenService')
    public citizenService: CitizenService,
    @inject('services.SubscriptionService')
    public subscriptionService: SubscriptionService,
    @inject('services.JwtService')
    public jwtService: JwtService,
    @service(UserRepository)
    private userRepository: UserRepository,
    @inject(SecurityBindings.USER, {optional: true})
    private currentUser: IUser,
    @repository(SubscriptionRepository)
    public subscriptionRepository: SubscriptionRepository,
    @repository(IncentiveRepository)
    public incentiveRepository: IncentiveRepository,
    @repository(AffiliationRepository)
    public affiliationRepository: AffiliationRepository,
    @service(AffiliationService)
    public affiliationService: AffiliationService,
  ) {}

  /**
   * Create a new user
   * @param register the form or user object
   * @returns an object with new user id + firstName + lastName
   */
  @authenticate(AUTH_STRATEGY.API_KEY)
  @authorize({allowedRoles: [Roles.API_KEY]})
  @post('v1/citizens', {
    'x-controller-name': 'Citizens',
    summary: 'Crée un citoyen',
    security: SECURITY_SPEC_API_KEY,
    responses: {
      [StatusCode.Created]: {
        description: 'Le citoyen est enregistré',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  example: '',
                },
              },
            },
          },
        },
      },
      [StatusCode.NotFound]: {
        description: "L'entreprise du salarié est inconnue",
      },
      [StatusCode.PreconditionFailed]: {
        description:
          "L'email professionnel du salarié n'est pas du domaine de son entreprise",
      },
      [StatusCode.Conflict]: {
        description: "L'email personnel du salarié existe déjà",
      },
      [StatusCode.UnprocessableEntity]: {
        description: "L'email professionnel du salarié existe déjà",
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CitizenCreate),
        },
      },
    })
    rawCitizen: CitizenCreate,
  ): Promise<{id: string} | undefined> {
    const result: {id: string} | undefined = await this.citizenService.createCitizen(
      rawCitizen,
    );
    return result;
  }

  /**
   * @param [status] status in `status`
   * @param [lastName] Search in `lastName`
   * @param [skip] records.
   * @returns {Citizen[], number} List of salaries sorted by `lastName` and the total
   * number of employees based on their status or lastName
   */
  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({
    allowedRoles: [Roles.SUPERVISORS, Roles.MANAGERS],
  })
  @get('/v1/citizens', {
    'x-controller-name': 'Citizens',
    summary: "Retourne les salariés d'une entreprise",
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Search filter employees ',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Citizen),
            },
          },
        },
      },
    },
  })
  async findSalaries(
    @param.query.string('status', {
      description: `Filtre sur le statut de l'aide: AFFILIE | DESAFFILIE | A_AFFILIER`,
    })
    status?: string,
    @param.query.string('lastName', {
      description: `Filtre sur le nom de famille du citoyen`,
    })
    lastName?: string,
    @param.query.number('skip', {
      description: `Nombre d'éléments à sauter lors de la pagination`,
    })
    skip?: number,
  ): Promise<{employees: Citizen[] | undefined; employeesCount: number}> {
    const result = await this.citizenService.findEmployees({
      status,
      lastName,
      skip,
      limit: 10,
    });

    return result;
  }

  /**
   * get citizens with at least one subscription
   * @param lastName search params
   * @param skip number of element to skip
   */
  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({
    allowedRoles: [Roles.FUNDERS],
  })
  @get('/v1/collectivitiesCitizens', {
    'x-controller-name': 'Citizens',
    summary: 'Récupère la liste des citoyens ayant au moins une demande',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Array of subscriptions model instance',
        content: {
          'application/json': {
            schema: {
              type: 'object',
            },
          },
        },
      },
    },
  })
  async getCitizensWithSubscriptions(
    @param.query.string('lastName', {description: 'Nom de famille du citoyen'})
    lastName?: string,
    @param.query.number('skip', {
      description: "Nombre d'éléments à sauter lors de la pagination",
    })
    skip?: number | undefined,
  ): Promise<AnyObject> {
    const {incentiveType, funderName} = this.currentUser;

    const match: object[] = [
      {incentiveType: incentiveType},
      {funderName: funderName},
      {status: {$ne: SUBSCRIPTION_STATUS.DRAFT}},
    ];

    if (lastName) {
      match.push({
        lastName: new RegExp('.*' + lastName + '.*', 'i'),
      });
    }

    return this.subscriptionService.getCitizensWithSubscription(match, skip);
  }

  /**
   * get citizen profile by id
   * @param citizenId id of citizen
   * @param filter the citizen filter
   * @returns the profile of citizen
   */
  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({voters: [canAccessHisOwnData]})
  @get('v1/citizens/profile/{citizenId}', {
    'x-controller-name': 'Citizens',
    summary: "Retourne les informations d'un citoyen",
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Citizen model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Citizen),
          },
        },
      },
    },
  })
  async findById(
    @param.path.string('citizenId', {
      description: `L'identifiant du citoyen`,
    })
    citizenId: string,
  ): Promise<Citizen> {
    return this.citizenService.getCitizenWithAffiliationById(citizenId);
  }

  /**
   * get citizen by id
   * @param citizenId id of citizen
   * @param filter the citizen filter
   * @returns one citizen object
   */
  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @get('/v1/citizens/{citizenId}', {
    'x-controller-name': 'Citizens',
    security: SECURITY_SPEC_KC_PASSWORD,
    summary: "Retourne les informations d'un citoyen",
    responses: {
      [StatusCode.Success]: {
        description: 'Citizen model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Citizen),
          },
        },
      },
      [StatusCode.NotFound]: {
        description: "Ce citoyen n'existe pas",
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: 404,
                name: 'Error',
                message: 'Citizen not found',
                path: '/citizenNotFound',
                resourceName: 'Citizen',
              },
            },
          },
        },
      },
    },
  })
  async findCitizenId(
    @param.path.string('citizenId', {
      description: `L'identifiant du citoyen`,
    })
    citizenId: string,
  ): Promise<Record<string, string>> {
    const user: User = await this.userRepository.findById(this.currentUser?.id);
    const citizenData: Citizen = await this.citizenService.getCitizenWithAffiliationById(
      citizenId,
    );
    if (
      user &&
      this.currentUser?.roles?.includes('gestionnaires') &&
      user.funderId === citizenData.affiliation?.enterpriseId
    ) {
      return {
        lastName: citizenData?.identity?.lastName?.value,
        firstName: citizenData?.identity?.firstName?.value,
      };
    } else {
      throw new ValidationError('Access denied', '/authorization', StatusCode.Forbidden);
    }
  }

  /**
   * affiliate connected citizen
   * @param data has token needed to affiliate connected citizen
   */
  @authenticate(AUTH_STRATEGY.KEYCLOAK, AUTH_STRATEGY.API_KEY)
  @authorize({
    allowedRoles: [Roles.SUPERVISORS, Roles.MANAGERS, Roles.API_KEY, Roles.CITIZENS],
  })
  @put('/v1/citizens/{citizenId}/affiliate', {
    'x-controller-name': 'Citizens',
    summary: 'Affilie un citoyen à une entreprise',
    security: SECURITY_SPEC_JWT_KC_PASSWORD,
    responses: {
      [StatusCode.NoContent]: {
        description: "L'affiliation est validée",
      },
      [StatusCode.NotFound]: {
        description: "L'affiliation n'existe pas",
      },
      [StatusCode.PreconditionFailed]: {
        description: "L'affiliation n'est pas au bon status",
      },
      [StatusCode.UnprocessableEntity]: {
        description: "L'affiliation n'est pas valide",
      },
    },
  })
  async validateAffiliation(
    @param.path.string('citizenId', {
      description: `L'identifiant du citoyen`,
    })
    citizenId: string,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
                example: `Un token d'affiliation`,
              },
            },
          },
        },
      },
    })
    data: {
      token: string;
    },
  ): Promise<void> {
    const user = this.currentUser;

    let citizen: Citizen | null = await this.citizenService.getCitizenWithAffiliationById(
      citizenId,
    );

    if (!user.id || user.roles?.includes(Roles.CITIZENS)) {
      citizen = await this.affiliationService.checkAffiliation(citizen, data.token);
    }
    citizen.affiliation!.status = AFFILIATION_STATUS.AFFILIATED;

    await this.affiliationRepository.updateById(citizen.affiliation.id, {
      status: AFFILIATION_STATUS.AFFILIATED,
    });

    if (user.id && user.funderName && citizen) {
      await this.affiliationService.sendValidatedAffiliation(citizen, user.funderName);
    }
  }

  /**
   * disaffiliate citizen by id
   * @param citizenId id citizen
   */
  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({
    allowedRoles: [Roles.MANAGERS, Roles.SUPERVISORS],
  })
  @put('/v1/citizens/{citizenId}/disaffiliate', {
    'x-controller-name': 'Citizens',
    summary: "Désaffilie un citoyen d'une entreprise",
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.NoContent]: {
        description: 'La désaffiliation est validée',
      },
      [StatusCode.NotFound]: {
        description: "Ce citoyen n'existe pas",
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: 404,
                name: 'Error',
                message: 'Citizen not found',
                path: '/citizenNotFound',
                resourceName: 'Citizen',
              },
            },
          },
        },
      },
      [StatusCode.PreconditionFailed]: {
        description: 'La désaffiliation est impossible',
      },
      [StatusCode.UnprocessableEntity]: {
        description: "La désaffiliation n'est pas valide",
      },
    },
  })
  async disaffiliation(
    @param.path.string('citizenId', {
      description: `L'identifiant du citoyen`,
    })
    citizenId: string,
  ): Promise<void> {
    const user = this.currentUser;
    const citizen: Citizen = await this.citizenService.getCitizenWithAffiliationById(
      citizenId,
    );
    await this.affiliationRepository.updateById(citizen.affiliation!.id, {
      status: AFFILIATION_STATUS.DISAFFILIATED,
    });

    if (
      user &&
      user?.funderName &&
      citizen.affiliation!.status === AFFILIATION_STATUS.TO_AFFILIATE
    ) {
      await this.affiliationService.sendRejectedAffiliation(citizen, user?.funderName);
    } else {
      await this.affiliationService.sendDisaffiliationMail(this.mailService, citizen);
    }
  }

  /**
   * Update citizen by id
   * @param citizenId id of citizen
   * @param rawCitizen CitizenUpdate
   */
  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({voters: [canAccessHisOwnData]})
  @patch('/v1/citizens/{citizenId}', {
    'x-controller-name': 'Citizens',
    summary: 'Modifie un citoyen',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.NoContent]: {
        description: 'Modification du citoyen réussie',
      },
      [StatusCode.Unauthorized]: {
        description: "L'utilisateur est non connecté",
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: StatusCode.Unauthorized,
                name: 'Error',
                message: 'Authorization header not found',
                path: '/authorization',
              },
            },
          },
        },
      },
      [StatusCode.Forbidden]: {
        description: "L'utilisateur n'a pas les droits pour modifier ce citoyen",
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: StatusCode.Forbidden,
                name: 'Error',
                message: 'Access denied',
              },
            },
          },
        },
      },
    },
  })
  async updateById(
    @param.path.string('citizenId', {
      description: `L'identifiant du citoyen`,
    })
    citizenId: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CitizenUpdate),
        },
      },
    })
    rawCitizen: CitizenUpdate,
  ): Promise<void> {
    /**
     * init a new citizen data for handling
     */
    let affiliationEnterprise = new Enterprise();

    const newCitizen = new Citizen(rawCitizen);

    /**
     * get citizen data
     */
    const currentCitizen: Citizen =
      await this.citizenService.getCitizenWithAffiliationById(citizenId);

    newCitizen.affiliation?.enterpriseId &&
      (affiliationEnterprise = await this.enterpriseRepository.findById(
        newCitizen.affiliation.enterpriseId,
      ));

    // Update affiliation if modified
    if (
      currentCitizen.affiliation?.enterpriseEmail !==
        newCitizen.affiliation.enterpriseEmail ||
      currentCitizen.affiliation?.enterpriseId !== newCitizen.affiliation.enterpriseId
    ) {
      // Update Affiliation
      if (currentCitizen.affiliation) {
        if (
          (newCitizen?.affiliation?.enterpriseId &&
            newCitizen?.affiliation?.enterpriseEmail) ||
          (affiliationEnterprise.hasManualAffiliation &&
            newCitizen.affiliation.enterpriseId)
        ) {
          currentCitizen.affiliation.status = AFFILIATION_STATUS.TO_AFFILIATE;
        } else {
          currentCitizen.affiliation.status = AFFILIATION_STATUS.UNKNOWN;
        }

        currentCitizen.affiliation.enterpriseEmail =
          newCitizen.affiliation.enterpriseEmail;
        currentCitizen.affiliation.enterpriseId = newCitizen.affiliation.enterpriseId;
        newCitizen.affiliation = currentCitizen.affiliation;

        // update affiliation repository
        currentCitizen.affiliation.id &&
          (await this.affiliationRepository.updateById(
            currentCitizen.affiliation.id,
            currentCitizen.affiliation,
          ));
      } else {
        currentCitizen.affiliation = newCitizen.affiliation;
        // Create affiliation
        const affiliation: Affiliation =
          await this.affiliationRepository.createAffiliation(
            currentCitizen,
            affiliationEnterprise.hasManualAffiliation,
          );
        newCitizen.affiliation = affiliation;
      }

      // send mail manual affiliation
      if (
        !newCitizen?.affiliation.enterpriseEmail &&
        affiliationEnterprise.hasManualAffiliation
      ) {
        await this.affiliationService.sendManualAffiliationMail(
          currentCitizen,
          affiliationEnterprise,
        );
      }
    }

    // send affiliation mail
    if (
      newCitizen?.affiliation?.status === AFFILIATION_STATUS.TO_AFFILIATE &&
      newCitizen?.affiliation.enterpriseEmail
    ) {
      const affiliationEmailData: any = {
        ...newCitizen,
        id: citizenId,
        identity: {...currentCitizen.identity},
      };

      await this.affiliationService.sendAffiliationMail(
        this.mailService,
        affiliationEmailData,
        affiliationEnterprise!.name,
      );
    }

    // update citizen in KC
    await this.keycloakService.updateUserKC(
      currentCitizen.id,
      Object.assign(currentCitizen, newCitizen),
    );
  }

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({voters: [canAccessHisOwnData]})
  @get('/v1/citizens/{citizenId}/export', {
    'x-controller-name': 'Citizens',
    summary: 'Exporte les données personnelles du citoyen connecté',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Downloadable .xlsx file with validated aides list',
        content: {
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
            schema: {type: 'string', format: 'base64'},
          },
        },
      },
    },
  })
  async generateUserRGPDExcelFile(
    @param.path.string('citizenId', {
      description: `L'identifiant du citoyen`,
    })
    citizenId: string,
    @inject(RestBindings.Http.RESPONSE) resp: Response,
  ): Promise<Response<Excel.Buffer>> {
    try {
      const citizen: Citizen = await this.citizenService.getCitizenWithAffiliationById(
        citizenId,
      );

      const listMaas: string[] = await this.citizenService.getListMaasNames(
        citizen?.personalInformation.email.value,
      );

      // get company name & company email from user affiliation
      let companyName: string = '';
      if (citizen.affiliation?.enterpriseId) {
        const enterprise: Enterprise = await this.enterpriseRepository.findById(
          citizen.affiliation!.enterpriseId,
        );
        companyName = enterprise.name;
      }

      // get all user subscriptions
      const subscriptions: Subscription[] = await this.subscriptionRepository.find({
        order: ['updatedAT ASC'],
        where: {citizenId: this.currentUser.id, status: {neq: SUBSCRIPTION_STATUS.DRAFT}},
      });

      // get all aides {id, title, specificFields}
      const incentives: Incentive[] = await this.incentiveRepository.find({
        fields: {id: true, title: true, specificFields: true},
      });

      // generate Excel RGPD file that contains all user private data
      const excelBufferRGPD: Excel.Buffer = await this.citizenService.generateExcelGDPR(
        citizen,
        companyName,
        subscriptions,
        incentives,
        listMaas,
      );

      // send the file to user
      return resp
        .status(200)
        .contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        .send(excelBufferRGPD);
    } catch (error) {
      throw new ValidationError(
        'Le téléchargement a échoué, veuillez réessayer',
        '/downloadXlsx',
        StatusCode.UnprocessableEntity,
        ResourceName.Subscription,
      );
    }
  }

  /**
   * Delete citizen account
   * @param citizenId id citizen
   */
  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({voters: [canAccessHisOwnData]})
  @put('/v1/citizens/{citizenId}/delete', {
    'x-controller-name': 'Citizens',
    summary: "Supprimer le compte d'un citoyen",
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.NoContent]: {
        description: 'La suppression est effectuée',
      },
      [StatusCode.Unauthorized]: {
        description: "L'utilisateur n'est pas connecté",
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: 401,
                name: 'Error',
                message: 'Authorization header not found',
                path: '/authorization',
              },
            },
          },
        },
      },
      [StatusCode.Forbidden]: {
        description:
          "Vous n'avez pas les droits pour supprimer le compte de cet utilisateur",
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: 403,
                name: 'Error',
                message: 'Access denied',
                path: '/authorization',
              },
            },
          },
        },
      },
    },
  })
  async deleteCitizenAccount(
    @param.path.string('citizenId', {
      description: `L'identifiant du citoyen`,
    })
    citizenId: string,
  ): Promise<void> {
    const citizen: Citizen = await this.citizenService.getCitizenWithAffiliationById(
      citizenId,
    );

    if (citizen.affiliation) {
      // Delete affiliation from MongoDB
      await this.affiliationRepository.deleteById(citizen.affiliation.id);
    }

    // Delete citizen from Keycloak
    await this.keycloakService.deleteUserKc(citizen.id);

    // ADD Flag "Compte Supprimé" to citizen Subscription
    const citizenSubscriptions = await this.subscriptionRepository.find({
      where: {citizenId: citizen.id},
    });

    citizenSubscriptions?.forEach(async citizenSubscription => {
      citizenSubscription.isCitizenDeleted = true;
      await this.subscriptionRepository.updateById(
        citizenSubscription.id,
        citizenSubscription,
      );
    });

    const date = formatDateInTimezone(new Date(), "dd/MM/yyyy à H'h'mm");
    await this.citizenService.sendDeletionMail(this.mailService, citizen, date);
  }

  /**
   * get consents by citizen id
   * @param citizenId id of citizen
   * @returns liste des clients en consentement avec le citoyen
   */
  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({voters: [canAccessHisOwnData]})
  @get('/v1/citizens/{citizenId}/linkedAccounts', {
    'x-controller-name': 'Citizens',
    security: SECURITY_SPEC_KC_PASSWORD,
    summary: "Retourne le nom et l'ID des clients en consentement avec le citoyen",
    responses: {
      [StatusCode.Success]: {
        description: 'Modèle des informations du consentement',
        content: {
          'application/json': {
            example: {
              clientInfo: {
                clientName: 'Mulhouse',
                clientId: 'mulhouse-maas-client',
              },
            },
          },
        },
      },
      [StatusCode.Forbidden]: {
        description: "Vous n'êtes autorisé à consulter que vos propres consentements",
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: 403,
                name: 'Error',
                message: 'Access denied',
              },
            },
          },
        },
      },
    },
  })
  async findConsentsById(
    @param.path.string('citizenId', {
      description: `L'identifiant du citoyen`,
    })
    citizenId: string,
  ): Promise<(ClientOfConsent | undefined)[]> {
    const citizenConsentsList = await this.keycloakService.listConsents(citizenId);
    const clientsList = await this.citizenService.getClientList();

    const consentListData = citizenConsentsList.map((element: Consent) =>
      clientsList.find(clt => element.clientId === clt.clientId),
    );

    return consentListData;
  }

  /**
   * delete consent by id
   * @param citizenId id of citizen
   * @param clientId id du client en consentement avec le citoyen
   */

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({voters: [canAccessHisOwnData]})
  @del('/v1/citizens/{citizenId}/linkedAccounts/{clientId}', {
    'x-controller-name': 'Citizens',
    summary: 'Supprime un consentement',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.NoContent]: {
        description: 'Consentement supprimé',
      },
      [StatusCode.Forbidden]: {
        description: 'Vous ne pouvez supprimer que vos propres consentements',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: 403,
                name: 'Error',
                message: 'Access denied',
              },
            },
          },
        },
      },
      [StatusCode.NotFound]: {
        description: 'Consentement introuvable',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: 404,
                name: 'Error',
                message: 'consent not found',
                path: '/consentNotFound',
              },
            },
          },
        },
      },
    },
  })
  async deleteConsentById(
    @param.path.string('citizenId', {
      description: `L'identifiant du citoyen`,
    })
    citizenId: string,
    @param.path.string('clientId', {
      description: `L'identifiant du client en consentement avec le citoyen`,
    })
    clientId: string,
  ): Promise<void> {
    await this.keycloakService.deleteConsent(citizenId, clientId);
  }
}
