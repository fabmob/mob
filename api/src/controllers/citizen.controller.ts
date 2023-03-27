import * as Excel from 'exceljs';
import {inject, intercept, service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
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
  CommunityRepository,
  SubscriptionRepository,
  IncentiveRepository,
  AffiliationRepository,
  FunderRepository,
} from '../repositories';
import {
  CitizenService,
  KeycloakService,
  MailService,
  JwtService,
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
  CitizenCreate,
  Funder,
  CitizenFilter,
} from '../models';
import {InternalServerError} from '../validationError';
import {
  StatusCode,
  AFFILIATION_STATUS,
  Roles,
  SUBSCRIPTION_STATUS,
  SECURITY_SPEC_API_KEY,
  SECURITY_SPEC_KC_PASSWORD,
  AUTH_STRATEGY,
  Consent,
  ClientOfConsent,
  IUser,
  Logger,
  SECURITY_SPEC_API_KEY_KC_PASSWORD,
  FilterCitizen,
} from '../utils';
import {canAccessCitizenData, canAccessHisOwnData} from '../services/user.authorizor';
import {formatDateInTimezone} from '../utils/date';
import {defaultSwaggerError} from './utils/swagger-errors';

@intercept(CitizenInterceptor.BINDING_KEY)
export class CitizenController {
  constructor(
    @inject(RestBindings.Http.RESPONSE) private response: Response,
    @inject('services.MailService')
    public mailService: MailService,
    @repository(CommunityRepository)
    public communityRepository: CommunityRepository,
    @inject('services.KeycloakService')
    public keycloakService: KeycloakService,
    @repository(FunderRepository)
    public funderRepository: FunderRepository,
    @inject('services.CitizenService')
    public citizenService: CitizenService,
    @inject('services.SubscriptionService')
    public subscriptionService: SubscriptionService,
    @inject('services.JwtService')
    public jwtService: JwtService,
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
      ...defaultSwaggerError,
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
    this.response.status(201);
    try {
      const result: {id: string} | undefined = await this.citizenService.createCitizen(rawCitizen);
      return result;
    } catch (error) {
      Logger.error(CitizenController.name, this.create.name, 'Error', error);
      throw error;
    }
  }

  /**
   * get citizen by id
   * @param citizenId id of citizen
   * @param filter the citizen filter
   * @returns one citizen object
   */
  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({
    voters: [canAccessCitizenData],
    allowedRoles: [Roles.MANAGERS, Roles.CITIZENS],
  })
  @get('/v1/citizens/{citizenId}', {
    'x-controller-name': 'Citizens',
    security: SECURITY_SPEC_KC_PASSWORD,
    summary: "Retourne les informations d'un citoyen",
    description: `Ce service permet de récupérer les informations d'un citoyen.<br>
    Il permet également de ne renvoyer que les champs souhaités en utilisant la clause
    fields du filtre.
    En termes de sécurité, les scopes de données doivent être retournés uniquement si 
    l'access token contient le scope associé comme suit : 
    <ul>
    <li>La partie identity est retournée si le scope profile ou le scope urn:cms:identity \
    est dans l'access token.</li>
    <li>La partie personalInformation est retournée si les scopes address, email, phone et\
     le scope urn:cms:personalInformation sont dans l'access token.</li>
     <li>La partie dgfip-information est retournée si le scope urn:cms:dgfip-informaiton est\
      dans l'access token.</li>
    </ul>
    `,
    responses: {
      [StatusCode.Success]: {
        description: 'Les informations du citoyen',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Citizen, {
              title: 'CitizenExcludeHidden',
              exclude: [
                'password',
                'tos1',
                'tos2',
                'terms_and_conditions',
                'isInactivityNotificationSent',
                'lastLoginAt',
                'updatedAt',
              ],
            }),
          },
        },
      },
      ...defaultSwaggerError,
    },
  })
  async findById(
    @param.path.string('citizenId', {
      description: `L'identifiant du citoyen`,
    })
    citizenId: string,
    @param.filter(CitizenFilter, {exclude: ['skip', 'offset', 'limit', 'where', 'order', 'include']})
    filter?: FilterCitizen,
  ): Promise<Citizen> {
    try {
      const result: Citizen = await this.citizenService.getCitizenByFilter(citizenId, filter);
      Logger.debug(CitizenController.name, this.findById.name, 'result', result);

      return result;
    } catch (error) {
      Logger.error(CitizenController.name, this.findById.name, 'Error', error);
      throw error;
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
  @post('/v1/citizens/{citizenId}/affiliate', {
    'x-controller-name': 'Citizens',
    summary: 'Affilie un citoyen à une entreprise',
    security: SECURITY_SPEC_API_KEY_KC_PASSWORD,
    responses: {
      [StatusCode.NoContent]: {
        description: "L'affiliation est validée",
      },
      ...defaultSwaggerError,
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
                example: "un token d'affiliation",
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
    try {
      const user = this.currentUser;

      let citizen: Citizen | null = await this.citizenService.getCitizenWithAffiliationById(citizenId);

      Logger.debug(CitizenController.name, this.validateAffiliation.name, 'citizen', citizen);

      if (!user.id || user.roles?.includes(Roles.CITIZENS)) {
        citizen = await this.affiliationService.checkAffiliation(citizen, data.token);
      }
      citizen.affiliation!.status = AFFILIATION_STATUS.AFFILIATED;

      await this.affiliationRepository.updateById(citizen.affiliation.id, {
        status: AFFILIATION_STATUS.AFFILIATED,
      });
      Logger.info(
        CitizenController.name,
        this.validateAffiliation.name,
        'Affiliation updated',
        citizen.affiliation.id,
      );

      if (user.id && user.funderName && citizen) {
        await this.affiliationService.sendValidatedAffiliation(citizen, user.funderName);
        Logger.info(
          CitizenController.name,
          this.validateAffiliation.name,
          'Affiliation email sent',
          citizen.affiliation.id,
        );
      }
    } catch (error) {
      Logger.error(CitizenController.name, this.validateAffiliation.name, 'Error', error);
      throw error;
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
  @post('/v1/citizens/{citizenId}/disaffiliate', {
    'x-controller-name': 'Citizens',
    summary: "Désaffilie un citoyen d'une entreprise",
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.NoContent]: {
        description: 'La désaffiliation est validée',
      },
      ...defaultSwaggerError,
    },
  })
  async disaffiliation(
    @param.path.string('citizenId', {
      description: `L'identifiant du citoyen`,
    })
    citizenId: string,
  ): Promise<void> {
    try {
      const user = this.currentUser;
      const citizen: Citizen = await this.citizenService.getCitizenWithAffiliationById(citizenId);
      await this.affiliationRepository.updateById(citizen.affiliation!.id, {
        status: AFFILIATION_STATUS.DISAFFILIATED,
      });
      Logger.info(
        CitizenController.name,
        this.disaffiliation.name,
        'Affiliation updated',
        citizen.affiliation.id,
      );

      if (user && user?.funderName && citizen.affiliation!.status === AFFILIATION_STATUS.TO_AFFILIATE) {
        await this.affiliationService.sendRejectedAffiliation(citizen, user?.funderName);
        Logger.info(
          CitizenController.name,
          this.disaffiliation.name,
          'Rejected affiliation email sent',
          citizen.affiliation.id,
        );
      } else {
        await this.affiliationService.sendDisaffiliationMail(this.mailService, citizen);
        Logger.info(
          CitizenController.name,
          this.disaffiliation.name,
          'Disaffiliation email sent',
          citizen.affiliation.id,
        );
      }
    } catch (error) {
      Logger.error(CitizenController.name, this.disaffiliation.name, 'Error', error);
      throw error;
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
      ...defaultSwaggerError,
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
    try {
      /**
       * init a new citizen data for handling
       */
      let affiliationEnterprise: Enterprise | null = null;

      const newCitizen = new Citizen(rawCitizen);
      Logger.debug(CitizenController.name, this.updateById.name, 'Citizen data', newCitizen);

      /**
       * get citizen data
       */
      const currentCitizen: Citizen = await this.citizenService.getCitizenWithAffiliationById(citizenId);
      Logger.debug(CitizenController.name, this.updateById.name, 'CurrentCitizen data', currentCitizen);

      newCitizen.affiliation?.enterpriseId &&
        (affiliationEnterprise = await this.funderRepository.getEnterpriseById(
          newCitizen.affiliation.enterpriseId,
        ));

      // Update affiliation if modified
      if (
        currentCitizen.affiliation?.enterpriseEmail !== newCitizen.affiliation.enterpriseEmail ||
        currentCitizen.affiliation?.enterpriseId !== newCitizen.affiliation.enterpriseId
      ) {
        // Update Affiliation
        if (currentCitizen.affiliation) {
          if (
            (newCitizen?.affiliation?.enterpriseId && newCitizen?.affiliation?.enterpriseEmail) ||
            (affiliationEnterprise?.enterpriseDetails.hasManualAffiliation &&
              newCitizen.affiliation.enterpriseId)
          ) {
            currentCitizen.affiliation.status = AFFILIATION_STATUS.TO_AFFILIATE;
          } else {
            currentCitizen.affiliation.status = AFFILIATION_STATUS.UNKNOWN;
          }

          currentCitizen.affiliation.enterpriseEmail = newCitizen.affiliation.enterpriseEmail;
          currentCitizen.affiliation.enterpriseId = newCitizen.affiliation.enterpriseId;
          newCitizen.affiliation = currentCitizen.affiliation;

          Logger.debug(
            CitizenController.name,
            this.updateById.name,
            'Affiliation data',
            newCitizen.affiliation,
          );

          // update affiliation repository
          currentCitizen.affiliation.id &&
            (await this.affiliationRepository.updateById(
              currentCitizen.affiliation.id,
              currentCitizen.affiliation,
            ));
          Logger.info(
            CitizenController.name,
            this.updateById.name,
            'Affiliation updated',
            currentCitizen.affiliation.id,
          );
        } else {
          currentCitizen.affiliation = newCitizen.affiliation;
          Logger.debug(
            CitizenController.name,
            this.updateById.name,
            'Affiliation data',
            newCitizen.affiliation,
          );

          // Create affiliation
          const affiliation: Affiliation = await this.affiliationRepository.createAffiliation(
            currentCitizen,
            Boolean(affiliationEnterprise?.enterpriseDetails.hasManualAffiliation),
          );
          Logger.info(CitizenController.name, this.updateById.name, 'Affiliation created', affiliation.id);

          newCitizen.affiliation = affiliation;
        }

        // send mail manual affiliation
        if (
          !newCitizen?.affiliation.enterpriseEmail &&
          affiliationEnterprise?.enterpriseDetails.hasManualAffiliation
        ) {
          await this.affiliationService.sendManualAffiliationMail(currentCitizen, affiliationEnterprise);
          Logger.info(
            CitizenController.name,
            this.updateById.name,
            'Manual Affiliation email sent',
            newCitizen.affiliation.id,
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
        Logger.info(
          CitizenController.name,
          this.updateById.name,
          'Affiliation email sent',
          newCitizen.affiliation.id,
        );
      }

      // update citizen in KC
      await this.keycloakService.updateUserKC(currentCitizen.id, Object.assign(currentCitizen, newCitizen));
      Logger.info(CitizenController.name, this.updateById.name, 'Citizen updated', currentCitizen.id);
    } catch (error) {
      Logger.error(CitizenController.name, this.updateById.name, 'Error', error);
      throw error;
    }
  }

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({voters: [canAccessHisOwnData]})
  @get('/v1/citizens/{citizenId}/export', {
    'x-controller-name': 'Citizens',
    summary: 'Exporte les données personnelles du citoyen connecté',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description:
          'Fichier Microsoft Excel contenant les données personnelles du citoyen et ses souscriptions',
        content: {
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
            schema: {type: 'string', format: 'base64'},
          },
        },
      },
      ...defaultSwaggerError,
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
      const citizen: Citizen = await this.citizenService.getCitizenWithAffiliationById(citizenId);
      Logger.debug(CitizenController.name, this.generateUserRGPDExcelFile.name, 'Citizen', citizen);

      const listMaas: string[] = await this.citizenService.getListMaasNames(
        citizen?.personalInformation.email.value,
      );
      Logger.debug(CitizenController.name, this.generateUserRGPDExcelFile.name, 'List maas', listMaas);

      // get company name & company email from user affiliation
      let companyName: string = '';
      if (citizen.affiliation?.enterpriseId) {
        const enterprise: Enterprise = (await this.funderRepository.getEnterpriseById(
          citizen.affiliation!.enterpriseId,
        )) as Enterprise;
        companyName = enterprise.name;
      }

      // get all user subscriptions
      const subscriptions: Subscription[] = await this.subscriptionRepository.find({
        order: ['updatedAT ASC'],
        where: {citizenId: this.currentUser.id, status: {neq: SUBSCRIPTION_STATUS.DRAFT}},
      });
      Logger.debug(
        CitizenController.name,
        this.generateUserRGPDExcelFile.name,
        'Souscriptions',
        subscriptions,
      );

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

      Logger.info(CitizenController.name, this.generateUserRGPDExcelFile.name, 'GDPR Buffer generated');

      // send the file to user
      return resp
        .status(200)
        .contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        .send(excelBufferRGPD);
    } catch (error) {
      throw new InternalServerError(CitizenController.name, this.generateUserRGPDExcelFile.name, error);
    }
  }

  /**
   * Delete citizen account
   * @param citizenId id citizen
   */
  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({voters: [canAccessHisOwnData]})
  @del('/v1/citizens/{citizenId}', {
    'x-controller-name': 'Citizens',
    summary: "Supprimer le compte d'un citoyen",
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.NoContent]: {
        description: 'La suppression est effectuée',
      },
      ...defaultSwaggerError,
    },
  })
  async deleteCitizenAccount(
    @param.path.string('citizenId', {
      description: `L'identifiant du citoyen`,
    })
    citizenId: string,
  ): Promise<void> {
    try {
      const citizen: Citizen = await this.citizenService.getCitizenWithAffiliationById(citizenId);
      Logger.debug(CitizenController.name, this.deleteCitizenAccount.name, 'Citizen', citizen);

      if (citizen.affiliation) {
        // Delete affiliation from MongoDB
        await this.affiliationRepository.deleteById(citizen.affiliation.id);
        Logger.info(
          CitizenController.name,
          this.deleteCitizenAccount.name,
          'Affiliation deleted',
          citizen.affiliation.id,
        );
      }

      // Delete citizen from Keycloak
      await this.keycloakService.deleteUserKc(citizen.id);
      Logger.info(
        CitizenController.name,
        this.deleteCitizenAccount.name,
        'Citizen deleted in KC',
        citizen.id,
      );

      // ADD Flag "Compte Supprimé" to citizen Subscription
      const citizenSubscriptions = await this.subscriptionRepository.find({
        where: {citizenId: citizen.id},
      });

      citizenSubscriptions?.forEach(async citizenSubscription => {
        citizenSubscription.isCitizenDeleted = true;
        await this.subscriptionRepository.updateById(citizenSubscription.id, citizenSubscription);
      });
      Logger.info(
        CitizenController.name,
        this.deleteCitizenAccount.name,
        'Citizen flag is deleted added on subscriptions',
        citizen.id,
      );

      const date = formatDateInTimezone(new Date(), "dd/MM/yyyy à H'h'mm");
      await this.citizenService.sendDeletionMail(this.mailService, citizen, date);
      Logger.info(
        CitizenController.name,
        this.deleteCitizenAccount.name,
        'Citizen deletion email sent',
        citizen.id,
      );
    } catch (error) {
      Logger.error(CitizenController.name, this.deleteCitizenAccount.name, 'Error', error);
      throw error;
    }
  }

  /**
   * get consents by citizen id
   * @param citizenId id of citizen
   * @returns liste des clients en consentement avec le citoyen
   */
  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({voters: [canAccessHisOwnData]})
  @get('/v1/citizens/{citizenId}/consents', {
    'x-controller-name': 'Citizens',
    security: SECURITY_SPEC_KC_PASSWORD,
    summary: 'Retourne les consentements accordés par le citoyen',
    responses: {
      [StatusCode.Success]: {
        description: 'La liste des clients présentant un consentement',
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
      ...defaultSwaggerError,
    },
  })
  async findConsentsById(
    @param.path.string('citizenId', {
      description: `L'identifiant du citoyen`,
    })
    citizenId: string,
  ): Promise<(ClientOfConsent | undefined)[]> {
    try {
      const citizenConsentsList = await this.keycloakService.listConsents(citizenId);
      Logger.debug(
        CitizenController.name,
        this.findConsentsById.name,
        'Citizen consent List',
        citizenConsentsList,
      );

      const clientsList = await this.citizenService.getClientList();
      Logger.debug(CitizenController.name, this.findConsentsById.name, 'Client List', clientsList);

      const consentListData = citizenConsentsList.map((element: Consent) =>
        clientsList.find(clt => element.clientId === clt.clientId),
      );
      Logger.debug(CitizenController.name, this.findConsentsById.name, 'Result', consentListData);

      return consentListData;
    } catch (error) {
      Logger.error(CitizenController.name, this.findConsentsById.name, 'Error', error);
      throw error;
    }
  }

  /**
   * delete consent by id
   * @param citizenId id of citizen
   * @param clientId id du client en consentement avec le citoyen
   */

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({voters: [canAccessHisOwnData]})
  @del('/v1/citizens/{citizenId}/consents/{clientId}', {
    'x-controller-name': 'Citizens',
    summary: 'Supprime un consentement',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.NoContent]: {
        description: 'Consentement supprimé',
      },
      ...defaultSwaggerError,
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
    try {
      await this.keycloakService.deleteConsent(citizenId, clientId);
      Logger.info(CitizenController.name, this.deleteConsentById.name, 'Consent deleted', clientId);
    } catch (error) {
      Logger.error(CitizenController.name, this.deleteConsentById.name, 'Error', error);
      throw error;
    }
  }
}
