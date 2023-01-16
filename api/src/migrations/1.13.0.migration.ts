import {repository} from '@loopback/repository';
import {service} from '@loopback/core';
import {MigrationScript, migrationScript} from 'loopback4-migration';
import {CitizenService, KeycloakService} from '../services';
import {
  AffiliationRepository,
  CitizenMigrationRepository,
  IncentiveEligibilityChecksRepository,
  IncentiveRepository,
  UserEntityRepository,
} from '../repositories';
import {ELIGIBILITY_CHECKS_LABEL, logger, SUBSCRIPTION_CHECK_MODE} from '../utils';
import {Citizen, CitizenMigration, Incentive} from '../models';
import {credentials} from '../constants';

// CP KC-admin interface to bypass lint length issue
interface AuthenticationFlowRepresentation {
  id?: string;
  alias?: string;
  description?: string;
  providerId?: string;
  topLevel?: boolean;
  builtIn?: boolean;
  authenticationExecutions?: {
    flowAlias?: string;
    userSetupAllowed?: boolean;
    authenticatorConfig?: string;
    authenticator?: string;
    requirement?: string;
    priority?: number;
    autheticatorFlow?: boolean;
  }[];
}

interface AuthenticationExecutionInfoRepresentation {
  id?: string;
  requirement?: string;
  displayName?: string;
  alias?: string;
  description?: string;
  requirementChoices?: string[];
  configurable?: boolean;
  authenticationFlow?: boolean;
  providerId?: string;
  authenticationConfig?: string;
  flowId?: string;
  level?: number;
  index?: number;
}

const INCENTIVE_ELIGIBILITY_CHECKS_LIST = [
  {
    name: 'Identité FranceConnect',
    label: ELIGIBILITY_CHECKS_LABEL.FRANCE_CONNECT,
    description:
      "Les données d'identité doivent être fournies/certifiées par FranceConnect",
    type: 'boolean',
    motifRejet: 'CompteNonFranceConnect',
  },
  {
    name: 'Offre à caractère exclusive, non cumulable',
    label: ELIGIBILITY_CHECKS_LABEL.EXCLUSION,
    description: "1 souscription valide pour un ensemble d'aides mutuellement exclusives",
    type: 'array',
    motifRejet: 'SouscriptionValideeExistante',
  },
];
@migrationScript()
export class MigrationScript1130 implements MigrationScript {
  version = '1.13.0';
  scriptName = MigrationScript1130.name;
  description =
    'add identity all non CMS info to KC, KC flows, affiliation \
  create eligibilityChecks, add subscriptionCheckMode,add boolean isCitizenNotificationsDisabled';

  constructor(
    @repository(CitizenMigrationRepository)
    private citizenMigrationRepository: CitizenMigrationRepository,
    @repository(AffiliationRepository)
    private affiliationRepository: AffiliationRepository,
    @repository(UserEntityRepository)
    private userEntityRepository: UserEntityRepository,
    @repository(IncentiveRepository)
    private incentiveRepository: IncentiveRepository,
    @repository(IncentiveEligibilityChecksRepository)
    private incentiveEligibilityChecksRepository: IncentiveEligibilityChecksRepository,
    @service(CitizenService)
    private citizenService: CitizenService,
    @service(KeycloakService)
    private keycloakService: KeycloakService,
  ) {}

  async up(): Promise<void> {
    logger.info(`${MigrationScript1130.name} - Started`);

    logger.info(`${MigrationScript1130.name} - Update incentive - Started`);

    const incentives: Incentive[] = await this.incentiveRepository.find({
      where: {isMCMStaff: true},
    });

    const updateIncentives: Promise<void>[] = incentives.map(
      async (incentive: Incentive) => {
        logger.info(
          `${MigrationScript1130.name} - Incentive ${incentive.title} with ID \
        ${incentive.id} will be updated`,
        );
        const incentiveData: Record<string, unknown> = {
          subscriptionCheckMode: SUBSCRIPTION_CHECK_MODE.MANUAL,
          isCitizenNotificationsDisabled: false,
        };
        return this.incentiveRepository.updateById(incentive.id, {...incentiveData});
      },
    );
    await Promise.allSettled(updateIncentives);

    logger.info(`${MigrationScript1130.name} - Update incentive - Completed`);

    logger.info(
      `${MigrationScript1130.name} - Create Incentive eligibility checks - Started`,
    );

    await Promise.allSettled(
      INCENTIVE_ELIGIBILITY_CHECKS_LIST.map(async (control: Record<string, string>) => {
        await this.incentiveEligibilityChecksRepository.create(control);

        logger.info(
          `${MigrationScript1130.name} - Incentive eligibility checks ${control.name}  is Created`,
        );
      }),
    );

    logger.info(
      `${MigrationScript1130.name} - Create Incentive eligibility checks - Completed`,
    );

    logger.info(`${MigrationScript1130.name} - Update Affiliation and KC info - Started`);

    // Update all citizens to add tos1, tos2, status, city and postcode in KC
    // Update all citizens affiliation
    const citizenMongoList: Array<CitizenMigration> =
      await this.citizenMigrationRepository.find();

    const updatedCitizenIdList: string[] = [];

    logger.info(
      `${MigrationScript1130.name} - Citizen ${citizenMongoList.length} will be updated`,
    );

    const updatedCitizens: Promise<void>[] = citizenMongoList.map(
      async (citizen: CitizenMigration) => {
        logger.info(
          `${MigrationScript1130.name} - Affiliation for citizen with ID ${citizen.id} will be created`,
        );

        const affiliationData: Record<string, unknown> = {
          citizenId: citizen.id,
          enterpriseId: citizen.affiliation.enterpriseId,
          enterpriseEmail: citizen.affiliation.enterpriseEmail,
          status: citizen.affiliation.affiliationStatus,
        };

        logger.info(
          `${MigrationScript1130.name} - Affiliation for citizen with ID ${citizen.id} created`,
        );

        await this.affiliationRepository.create(affiliationData);

        if (await this.userEntityRepository.exists(citizen.id)) {
          updatedCitizenIdList.push(citizen.id);
          logger.info(
            `${MigrationScript1130.name} - Citizen ${citizen.identity.lastName.value} with ID \
                ${citizen.id} will be updated with tos1: ${citizen.tos1}, tos2: ${citizen.tos2},\
                status: ${citizen.status}, city: ${citizen.city} and postcode: ${citizen.postcode}`,
          );
          const citizenFromKC: Citizen =
            await this.citizenService.getCitizenWithAffiliationById(citizen.id);
          await this.keycloakService.updateUserKC(
            citizen.id,
            Object.assign(citizenFromKC, citizen),
          );
          logger.info(
            `${MigrationScript1130.name} - Citizen ${citizen.identity.lastName.value} with ID \
                ${citizen.id} is updated`,
          );
        } else {
          logger.info(
            `${MigrationScript1130.name} - Citizen ${citizen.identity.lastName.value} with ID \
            ${citizen.id} does not exist in KC and will not be updated`,
          );
        }
      },
    );

    await Promise.allSettled(updatedCitizens);

    logger.info(
      `${MigrationScript1130.name} - Update Affiliation and KC info - Completed`,
    );

    logger.info(`${MigrationScript1130.name} - Update flows - Started`);
    // Create authenticator flow
    const executionToAddList: string[] = [
      'script-authenticator-FC-mappers.js',
      'script-authenticator-FC-group.js',
      'script-authenticator-FC-action.js',
    ];

    await Promise.allSettled(
      executionToAddList.map(async (execution: string) => {
        await this.keycloakService.keycloakAdmin.auth(credentials);

        const authenticatorFlowList: AuthenticationFlowRepresentation[] =
          await this.keycloakService.keycloakAdmin.authenticationManagement.getFlows();
        const existingFCFlow: AuthenticationFlowRepresentation | undefined =
          authenticatorFlowList.find(
            (flow: AuthenticationFlowRepresentation) =>
              flow.alias === 'FranceConnect - First broker login',
          );
        if (existingFCFlow) {
          logger.info(
            `${MigrationScript1130.name} - Update existing flow - ${existingFCFlow.id}`,
          );

          const existingExecutionsForFlow: AuthenticationExecutionInfoRepresentation[] =
            await this.keycloakService.keycloakAdmin.authenticationManagement.getExecutions(
              {
                flow: existingFCFlow.alias!,
              },
            );

          if (
            !existingExecutionsForFlow.find(
              (existingExecution: AuthenticationExecutionInfoRepresentation) =>
                existingExecution.providerId === execution,
            )
          ) {
            logger.info(`${MigrationScript1130.name} - Add flow - ${execution}`);
            const executionResult: AuthenticationExecutionInfoRepresentation =
              await this.keycloakService.keycloakAdmin.authenticationManagement.addExecutionToFlow(
                {flow: existingFCFlow.alias!, provider: execution},
              );

            logger.info(`${MigrationScript1130.name} - Edit flow to required \
          - ${JSON.stringify(execution)}`);
            await this.keycloakService.keycloakAdmin.authenticationManagement.updateExecution(
              {flow: existingFCFlow.alias!},
              Object.assign(executionResult, {requirement: 'REQUIRED'}),
            );
          }
        } else {
          logger.info(`${MigrationScript1130.name} - FC flow does not exist`);
        }
      }),
    );
    logger.info(`${MigrationScript1130.name} - Update flows - Completed`);
  }
}
