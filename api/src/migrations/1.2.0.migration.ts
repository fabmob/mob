import {Count, repository} from '@loopback/repository';
import {MigrationScript, migrationScript} from 'loopback4-migration';
import {Enterprise} from '../models';
import {EnterpriseRepository, SubscriptionRepository} from '../repositories';
import {logger} from '../utils';

@migrationScript()
export class MigrationScript120 implements MigrationScript {
  version = '1.2.0';
  scriptName = MigrationScript120.name;
  description = 'add manual affiliation to enterprises and delete all subscriptions';

  constructor(
    @repository(EnterpriseRepository)
    private enterpriseRepository: EnterpriseRepository,
    @repository(SubscriptionRepository)
    private subscriptionRepository: SubscriptionRepository,
  ) {}

  async up(): Promise<void> {
    logger.info(`${MigrationScript120.name} - Started`);

    // Update all enterprises to add hasManualAffiliation property
    const enterprises: Enterprise[] = await this.enterpriseRepository.find({
      where: {hasManualAffiliation: {exists: false}},
    });
    const updateEnterprises: Promise<void>[] = enterprises.map(enterprise => {
      logger.info(
        `${MigrationScript120.name} - Enterprise ${enterprise.name} with ID \
        ${enterprise.id} will be updated with hasManualAffiliation`,
      );
      return this.enterpriseRepository.updateById(enterprise.id, {
        hasManualAffiliation: false,
      });
    });
    await Promise.all(updateEnterprises);

    // Delete all old subscriptions
    const deletedSubscriptionCount: Count = await this.subscriptionRepository.deleteAll();
    logger.info(
      `${MigrationScript120.name} - ${deletedSubscriptionCount.count} subscriptions deleted`,
    );

    logger.info(`${MigrationScript120.name} - Completed`);
  }
}
