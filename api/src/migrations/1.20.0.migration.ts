import {MigrationScript, migrationScript} from 'loopback4-migration';
import {repository} from '@loopback/repository';
import {FUNDER_TYPE, GROUPS, Logger} from '../utils';
import {
  Collectivity,
  Enterprise,
  EnterpriseDetails,
  Funder,
  Incentive,
  NationalAdministration,
} from '../models';
import {FunderRepository, IncentiveRepository} from '../repositories';
import {CollectivityMigration} from '../models/funder/collectivityMigration.model';
import {EnterpriseMigration} from '../models/funder/enterpriseMigration.model';
import {CollectivityMigrationRepository} from '../repositories/collectivityMigration.repository';
import {EnterpriseMigrationRepository} from '../repositories/enterpriseMigration.repository';
import {service} from '@loopback/core';
import {KeycloakService} from '../services';

@migrationScript()
export class MigrationScript1200 implements MigrationScript {
  version = '1.20.0';
  scriptName = MigrationScript1200.name;
  description = 'Group collectivity and enterprise into funder and edit funderName on national incentive';

  constructor(
    @repository(CollectivityMigrationRepository)
    public collectivityMigrationRepository: CollectivityMigrationRepository,
    @repository(EnterpriseMigrationRepository)
    public enterpriseMigrationRepository: EnterpriseMigrationRepository,
    @repository(FunderRepository)
    public funderRepository: FunderRepository,
    @repository(IncentiveRepository)
    public incentiveRepository: IncentiveRepository,
    @service(KeycloakService)
    public keycloakService: KeycloakService,
  ) {}

  async up(): Promise<void> {
    Logger.info(MigrationScript1200.name, this.up.name, 'Started');

    Logger.info(MigrationScript1200.name, this.up.name, 'Collectivity started');

    const collectivityMigrationList: CollectivityMigration[] = (
      await this.collectivityMigrationRepository.find()
    ).filter(
      (collectivityMigration: CollectivityMigration) => collectivityMigration.name !== 'Aide nationale',
    );

    await Promise.allSettled(
      collectivityMigrationList.map(async (collectivityMigration: CollectivityMigration) => {
        try {
          Logger.info(
            MigrationScript1200.name,
            this.up.name,
            'Collectivity to update',
            collectivityMigration,
          );
          const collectivity: Collectivity = new Collectivity({
            id: collectivityMigration.id,
            name: collectivityMigration.name,
            type: FUNDER_TYPE.COLLECTIVITY,
            encryptionKey: collectivityMigration.encryptionKey,
            mobilityBudget: collectivityMigration.mobilityBudget,
            citizensCount: collectivityMigration.citizensCount,
          });

          const funderResult: Funder = await this.funderRepository.create(collectivity);
          Logger.info(MigrationScript1200.name, this.up.name, 'Collectivity updated to Funder', funderResult);
        } catch (err) {
          Logger.error(
            MigrationScript1200.name,
            this.up.name,
            `Collectivity ${collectivityMigration.id} - ${err}`,
          );
        }
      }),
    );
    Logger.info(MigrationScript1200.name, this.up.name, 'Collectivity completed');

    Logger.info(MigrationScript1200.name, this.up.name, 'Enterprise started');

    const enterpriseMigrationList: EnterpriseMigration[] = await this.enterpriseMigrationRepository.find();

    await Promise.allSettled(
      enterpriseMigrationList.map(async (enterpriseMigration: EnterpriseMigration) => {
        try {
          Logger.info(MigrationScript1200.name, this.up.name, 'Enterprise to update', enterpriseMigration);
          const enterprise: Enterprise = new Enterprise({
            id: enterpriseMigration.id,
            name: enterpriseMigration.name,
            type: FUNDER_TYPE.ENTERPRISE,
            encryptionKey: enterpriseMigration.encryptionKey,
            siretNumber: enterpriseMigration.siretNumber,
            mobilityBudget: enterpriseMigration.budgetAmount,
            citizensCount: enterpriseMigration.employeesCount,
            enterpriseDetails: new EnterpriseDetails({
              isHris: enterpriseMigration.isHris,
              hasManualAffiliation: enterpriseMigration.hasManualAffiliation,
              emailDomainNames: enterpriseMigration.emailFormat,
            }),
          });
          const funderResult: Funder = await this.funderRepository.create(enterprise);
          Logger.info(MigrationScript1200.name, this.up.name, 'Enterprise updated to Funder', funderResult);
        } catch (err) {
          Logger.error(
            MigrationScript1200.name,
            this.up.name,
            `Enterprise ${enterpriseMigration.id} - ${err}`,
          );
        }
      }),
    );
    Logger.info(MigrationScript1200.name, this.up.name, 'Enterprise completed');

    try {
      Logger.info(MigrationScript1200.name, this.up.name, 'National administration started');

      const nationalAdministrationKC: {id: string} = await this.keycloakService.createGroupKc(
        'Etat français',
        GROUPS.administrations_nationales,
      );

      const nationalAdministration: NationalAdministration = new NationalAdministration({
        id: nationalAdministrationKC.id,
        name: 'Etat français',
        type: FUNDER_TYPE.NATIONAL,
      });
      const funderResult: Funder = await this.funderRepository.create(nationalAdministration);
      Logger.info(MigrationScript1200.name, this.up.name, 'National administration created', funderResult);

      Logger.info(MigrationScript1200.name, this.up.name, 'National administration completed');

      Logger.info(MigrationScript1200.name, this.up.name, 'Incentive started');

      const incentiveList: Incentive[] = await this.incentiveRepository.find({
        where: {funderName: 'Aide nationale'},
      });

      await Promise.allSettled(
        incentiveList.map(async (incentive: Incentive) => {
          try {
            await this.incentiveRepository.updateById(incentive.id, {
              funderId: nationalAdministration.id,
              funderName: nationalAdministration.name,
            });
            Logger.info(MigrationScript1200.name, this.up.name, 'Incentive updated', incentive.id);
          } catch (err) {
            Logger.error(
              MigrationScript1200.name,
              this.up.name,
              `Incentive ${incentive.id} not updated`,
              err,
            );
          }
        }),
      );
      Logger.info(MigrationScript1200.name, this.up.name, 'Incentive completed');
    } catch (err) {
      Logger.error(MigrationScript1200.name, this.up.name, `Incentive not updated`, err);
    }

    Logger.info(MigrationScript1200.name, this.up.name, `Completed`);
  }
}
