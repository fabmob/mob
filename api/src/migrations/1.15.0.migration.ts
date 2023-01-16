import {repository} from '@loopback/repository';
import {MigrationScript, migrationScript} from 'loopback4-migration';
import {IncentiveEligibilityChecks} from '../models';
import {IncentiveEligibilityChecksRepository} from '../repositories';
import {ELIGIBILITY_CHECKS_LABEL, logger, REJECTION_REASON} from '../utils';

@migrationScript()
export class MigrationScript1150 implements MigrationScript {
  version = '1.15.0';
  scriptName = MigrationScript1150.name;
  description = 'Add new Control, Update name of exclusion control';

  constructor(
    @repository(IncentiveEligibilityChecksRepository)
    private incentiveEligibilityChecksRepository: IncentiveEligibilityChecksRepository,
  ) {}

  async up(): Promise<void> {
    logger.info(
      `${MigrationScript1150.name} - Add new Control, Update name of exclusion control - Started`,
    );

    const controlToAdd = {
      label: ELIGIBILITY_CHECKS_LABEL.RPC_CEE_REQUEST,
      name: 'Demande CEE au RPC',
      // eslint-disable-next-line
      description: `1 seule demande par dispositif CEE, enregistrée dans le Registre de Preuve de Covoiturage. Les informations techniques du point d'accès RPC doivent être ajoutées sur le financeur.`,
      type: 'boolean',
      motifRejet: REJECTION_REASON.INVALID_RPC_CEE_REQUEST,
    };

    const eligibilityChecks: IncentiveEligibilityChecks[] =
      await this.incentiveEligibilityChecksRepository.find();

    const exlusionEligibiltyChecks: IncentiveEligibilityChecks[] =
      eligibilityChecks.filter(
        (el: IncentiveEligibilityChecks) =>
          el.label === ELIGIBILITY_CHECKS_LABEL.EXCLUSION,
      );

    await Promise.allSettled(
      exlusionEligibiltyChecks.map(async (el: IncentiveEligibilityChecks) => {
        await this.incentiveEligibilityChecksRepository.updateById(el.id, {
          name: '[Pré-version] Offre à caractère exclusive, non cumulable',
        }),
          logger.info(
            `${MigrationScript1150.name} - Incentive eligibility checks ${el.name}  is Updated`,
          );
      }),
    );

    const found = eligibilityChecks.find(
      (el: IncentiveEligibilityChecks) =>
        el.label === ELIGIBILITY_CHECKS_LABEL.RPC_CEE_REQUEST,
    );

    if (!found) {
      await this.incentiveEligibilityChecksRepository.create(controlToAdd);
      logger.info(
        `${MigrationScript1150.name} - Incentive eligibility checks ${controlToAdd.name}  is Created`,
      );
    }

    logger.info(`${MigrationScript1150.name} - Completed`);
  }
}
