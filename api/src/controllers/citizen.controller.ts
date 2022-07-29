import * as Excel from 'exceljs';
import {inject, intercept, service} from '@loopback/core';
import {FilterExcludingWhere, repository, AnyObject} from '@loopback/repository';
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
import {pick, orderBy} from 'lodash';
import {
  CitizenRepository,
  EnterpriseRepository,
  CommunityRepository,
  UserRepository,
  SubscriptionRepository,
  IncentiveRepository,
} from '../repositories';
import {
  CitizenService,
  KeycloakService,
  MailService,
  JwtService,
  FunderService,
  IUser,
  SubscriptionService,
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
} from '../models';
import {ValidationError} from '../validationError';
import {
  ResourceName,
  StatusCode,
  AFFILIATION_STATUS,
  GROUPS,
  Roles,
  SUBSCRIPTION_STATUS,
  SECURITY_SPEC_API_KEY,
  SECURITY_SPEC_KC_PASSWORD,
  AUTH_STRATEGY,
  Consent,
  ClientOfConsent,
} from '../utils';
import {canAccessHisOwnData} from '../services/user.authorizor';
import {formatDateInTimezone} from '../utils/date';
import {RequiredActionAlias} from 'keycloak-admin/lib/defs/requiredActionProviderRepresentation';

@intercept(CitizenInterceptor.BINDING_KEY)
export class CitizenController {
  constructor(
    @inject('services.MailService')
    public mailService: MailService,
    @repository(CitizenRepository)
    public citizenRepository: CitizenRepository,
    @repository(CommunityRepository)
    public communityRepository: CommunityRepository,
    @inject('services.KeycloakService')
    public kcService: KeycloakService,
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
          schema: getModelSchemaRef(Citizen),
        },
      },
    })
    register: Omit<Citizen, 'id'>,
  ): Promise<{id: string}> {
    let keycloakResult;
    let enterprise = new Enterprise();

    try {
      const citizen: any = pick(register, [
        'email',
        'firstName',
        'lastName',
        'birthdate',
        'city',
        'postcode',
        'status',
        'tos1',
        'tos2',
        'affiliation',
      ]);

      // Vérification de l'enterprise
      if (citizen.affiliation?.enterpriseId) {
        enterprise = await this.enterpriseRepository.findById(
          citizen.affiliation.enterpriseId,
        );
      }

      // Check if the professional email is unique
      if (citizen.affiliation?.enterpriseId && citizen.affiliation?.enterpriseEmail) {
        await this.citizenService.checkProEmailExistence(
          citizen?.affiliation?.enterpriseEmail,
        );
      }

      // Vérification de l'email professionnel du salarié
      if (citizen.affiliation?.enterpriseId && citizen.affiliation?.enterpriseEmail) {
        this.citizenService.validateEmailPattern(
          citizen?.affiliation?.enterpriseEmail,
          enterprise?.emailFormat,
        );
      }

      const actions: RequiredActionAlias[] = [RequiredActionAlias.VERIFY_EMAIL];

      // Initialiser la creation de l'utilisateur dans KC
      keycloakResult = await this.kcService.createUserKc(
        {
          ...register,
          group: [GROUPS.citizens],
        },
        actions,
      );

      if (keycloakResult && keycloakResult.id) {
        citizen.id = keycloakResult.id;

        // Création de la demande d'affiliation
        const affiliation: Affiliation = new Affiliation(citizen.affiliation);

        // Checker si l'un de l'enterpriseId ou/et l'enterpriseEmail sont fournit
        if (
          (!affiliation.enterpriseId && affiliation.enterpriseEmail) ||
          (affiliation.enterpriseId && !affiliation.enterpriseEmail) ||
          (!affiliation.enterpriseId && !affiliation.enterpriseEmail)
        ) {
          affiliation.enterpriseId = !affiliation.enterpriseId
            ? null
            : affiliation.enterpriseId;
          affiliation.enterpriseEmail = !affiliation.enterpriseEmail
            ? null
            : affiliation.enterpriseEmail;
          affiliation.affiliationStatus = AFFILIATION_STATUS.UNKNOWN;
        }

        if (affiliation.enterpriseId && affiliation.enterpriseEmail) {
          affiliation.affiliationStatus = AFFILIATION_STATUS.TO_AFFILIATE;
        }

        citizen.affiliation = affiliation;

        // Standarize the lastName and fistName string format to be lowerCase for order optimization
        citizen.lastName = citizen.lastName.toLowerCase();
        citizen.firstName = citizen.firstName.toLowerCase();

        const result = await this.citizenRepository.create({
          ...citizen,
          ...keycloakResult,
        });
        // Envoi du mail de verification
        await this.kcService.sendExecuteActionsEmailUserKc(result.id, actions);

        // Envoi du mail d'affiliation sous le citizen Service
        if (result?.affiliation?.affiliationStatus !== AFFILIATION_STATUS.UNKNOWN) {
          await this.citizenService.sendAffiliationMail(
            this.mailService,
            result,
            enterprise!.name,
          );
        }

        return {
          id: result.id,
        };
      }

      return keycloakResult;
    } catch (error) {
      if (keycloakResult && keycloakResult.id) {
        await this.citizenRepository.deleteById(keycloakResult.id);
        await this.kcService.deleteUserKc(keycloakResult.id);
      }
      throw error;
    }
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
    @param.filter(Citizen, {exclude: 'where'})
    filter?: FilterExcludingWhere<Citizen>,
  ): Promise<Citizen> {
    return this.citizenRepository.findById(citizenId, filter);
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
  ): Promise<Partial<Citizen>> {
    const user = await this.userRepository.findById(this.currentUser?.id);
    const citizenData = await this.citizenRepository.findById(citizenId);
    if (
      user &&
      this.currentUser?.roles?.includes('gestionnaires') &&
      user.funderId === citizenData?.affiliation?.enterpriseId
    ) {
      return {
        lastName: citizenData?.lastName,
        firstName: citizenData?.firstName,
      };
    } else {
      throw new ValidationError('Access denied', '/authorization', StatusCode.Forbidden);
    }
  }

  /**
   * affiliate connected citizen
   * @param data has token needed to affiliate connected citizen
   */
  @authenticate(AUTH_STRATEGY.API_KEY)
  @authorize({allowedRoles: [Roles.API_KEY]})
  @put('/v1/citizens/affiliate', {
    'x-controller-name': 'Citizens',
    summary: 'Affilie un citoyen à une entreprise',
    security: SECURITY_SPEC_API_KEY,
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
            required: ['token'],
          },
        },
      },
    })
    data: {
      token: string;
    },
  ): Promise<void> {
    if (!data?.token) {
      throw new ValidationError(
        'citizens.affiliation.not.found',
        '/citizensAffiliationNotFound',
        StatusCode.NotFound,
        ResourceName.Affiliation,
      );
    }
    const citizen: Citizen = await this.citizenService.checkAffiliation(data.token);
    citizen.affiliation!.affiliationStatus = AFFILIATION_STATUS.AFFILIATED;

    await this.citizenRepository.updateById(citizen.id, {
      affiliation: {...citizen.affiliation},
    });
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
    const citizen: Citizen = await this.citizenRepository.findById(citizenId);
    citizen.affiliation!.affiliationStatus = AFFILIATION_STATUS.DISAFFILIATED;

    await this.citizenRepository.updateById(citizen.id, {
      affiliation: {...citizen.affiliation},
    });

    await this.citizenService.sendDisaffiliationMail(this.mailService, citizen);
  }

  /**
   * Update citizen by id
   * @param citizenId id of citizen
   * @param citizen schema
   */
  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({voters: [canAccessHisOwnData]})
  @patch('/v1/citizens/{citizenId}', {
    'x-controller-name': 'Citizens',
    summary: "Modifie des informations d'un citoyen",
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Citizen PATCH success',
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
      [StatusCode.UnprocessableEntity]: {
        description: "L'email professionnel du salarié existe déjà",
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
    citizen: CitizenUpdate,
  ): Promise<{id: string}> {
    /**
     * init a new citizen data for handling
     */
    const newCitizen: any = {
      ...citizen,
    };

    /**
     * set a new affiliation object state depending on enterpriseId and enterpriseEmail existence and not empty strings
     */
    if (
      newCitizen?.affiliation?.enterpriseId &&
      newCitizen?.affiliation?.enterpriseEmail
    ) {
      newCitizen.affiliation.affiliationStatus = AFFILIATION_STATUS.TO_AFFILIATE;
    }

    /**
     * set or not the new affiliation object state depending on what the form returns
     */
    if (
      (newCitizen?.affiliation &&
        !newCitizen?.affiliation?.enterpriseId &&
        newCitizen?.affiliation?.enterpriseEmail) ||
      (newCitizen?.affiliation &&
        newCitizen?.affiliation?.enterpriseId &&
        !newCitizen?.affiliation?.enterpriseEmail) ||
      (newCitizen?.affiliation &&
        !newCitizen?.affiliation?.enterpriseId &&
        !newCitizen?.affiliation?.enterpriseEmail)
    ) {
      newCitizen.affiliation.enterpriseId || null;
      newCitizen.affiliation.enterpriseEmail || null;
      newCitizen.affiliation.affiliationStatus = AFFILIATION_STATUS.UNKNOWN;
    }

    /**
     * Check if the professional email is unique
     */
    if (
      newCitizen?.affiliation?.enterpriseId &&
      newCitizen?.affiliation?.enterpriseEmail
    ) {
      const oldCitizen: Citizen = await this.citizenRepository.findById(citizenId);

      if (
        newCitizen?.affiliation?.enterpriseEmail !==
        oldCitizen?.affiliation?.enterpriseEmail
      ) {
        await this.citizenService.checkProEmailExistence(
          newCitizen?.affiliation?.enterpriseEmail,
        );
      }
    }

    /**
     * pre-check and validation of the enterprise data
     */
    let enterprise: {emailFormat: string[]; name: string};

    if (
      newCitizen?.affiliation?.enterpriseId &&
      newCitizen?.affiliation?.enterpriseEmail
    ) {
      /**
       * get the related company by id
       */
      enterprise = await this.enterpriseRepository.findById(
        newCitizen.affiliation.enterpriseId,
      );

      /**
       * validate the professional email pattern
       */
      const companyEmail = newCitizen.affiliation.enterpriseEmail;
      this.citizenService.validateEmailPattern(companyEmail, enterprise?.emailFormat);
    }

    /**
     * update the citizen data
     */
    await this.citizenRepository.updateById(citizenId, newCitizen);

    /**
     * proceed to send the affiliation email to the citizen's professional email
     */
    if (newCitizen?.affiliation?.affiliationStatus === AFFILIATION_STATUS.TO_AFFILIATE) {
      /**
       * init the affiliation email payload
       */
      const affiliationEmailData = {
        ...newCitizen,
        id: citizenId,
      };

      /**
       * send the affiliation email
       */
      await this.citizenService.sendAffiliationMail(
        this.mailService,
        affiliationEmailData,
        enterprise!.name,
      );
    }

    return {id: citizenId};
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
      const citizen: Citizen = await this.citizenRepository.findById(citizenId);

      const listMaas: string[] = await this.citizenService.getListMaasNames(
        citizen?.email,
      );

      // get company name & company email from user affiliation
      let companyName: string = '';
      if (citizen?.affiliation?.enterpriseId) {
        const enterprise: Enterprise = await this.enterpriseRepository.findById(
          citizen?.affiliation?.enterpriseId,
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
      const excelBufferRGPD: Excel.Buffer = await this.citizenService.generateExcelRGPD(
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
    const citizen: Citizen = await this.citizenRepository.findById(citizenId);

    // Delete citizen from MongoDB
    await this.citizenRepository.deleteById(citizen.id);

    // Delete citizen from Keycloak
    await this.kcService.deleteUserKc(citizen.id);

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
    const citizenConsentsList = await this.kcService.listConsents(citizenId);
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
    await this.kcService.deleteConsent(citizenId, clientId);
  }
}
