import {service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {MigrationScript, migrationScript} from 'loopback4-migration';
import {removeWhiteSpace} from '../controllers/utils/helpers';
import {Incentive, Territory} from '../models';
import {IncentiveRepository, TerritoryRepository} from '../repositories';
import {TerritoryService} from '../services/territory.service';
import {logger} from '../utils';

@migrationScript()
export class MigrationScript110 implements MigrationScript {
  version = '1.10.0';
  scriptName = MigrationScript110.name;
  description = 'Add Territory Model';

  constructor(
    @repository(IncentiveRepository) private incentiveRepository: IncentiveRepository,
    @repository(TerritoryRepository) private territoryRepository: TerritoryRepository,
    @service(TerritoryService) public territoryService: TerritoryService,
  ) {}

  async up(): Promise<void> {
    logger.info(`${MigrationScript110.name} - Started`);

    const territoriesToCreate: string[] = [];
    let count: number = 0;

    const incentivesList: Incentive[] = await this.incentiveRepository.find({
      where: {territory: {exists: false}},
      fields: {id: true, territoryName: true},
    });

    const createdTerritories: Territory[] = await this.territoryRepository.find();
    logger.info(
      `${MigrationScript110.name} - {${createdTerritories.length}} Territories from database`,
    );
    logger.info(
      `${MigrationScript110.name} - Initial Created Territories from database : \
       ${
         createdTerritories.length ? JSON.stringify(createdTerritories, null, 2) : 'None'
       }`,
    );

    incentivesList.map((incentive: Incentive) => {
      const name: string = removeWhiteSpace(incentive.territoryName);

      const foundInIncentive: string | undefined = territoriesToCreate.find(
        (territoryName: string) =>
          territoryName.toLowerCase() === incentive.territoryName.toLowerCase(),
      );

      const foundInTerritory: Territory | undefined = createdTerritories.find(
        (territory: Territory) => territory.name.toLowerCase() === name.toLowerCase(),
      );

      if (!foundInTerritory && !foundInIncentive) {
        territoriesToCreate.push(incentive.territoryName);
      }
    });

    logger.info(
      `${MigrationScript110.name} - {${territoriesToCreate.length}} Territories will be created`,
    );
    logger.info(
      `${MigrationScript110.name} - Territories that will be Created : \
       ${
         territoriesToCreate.length
           ? JSON.stringify(territoriesToCreate, null, 2)
           : 'None'
       }`,
    );

    await Promise.all(
      territoriesToCreate.map(async (territoy: string) => {
        const createdTerritory: Territory = await this.territoryService.createTerritory({
          name: territoy,
        } as Territory);
        createdTerritories.push(createdTerritory);

        logger.info(
          `${MigrationScript110.name} - Territory ${createdTerritory.name} with ID \ 
          ${createdTerritory.id} is Created`,
        );
      }),
    );

    logger.info(
      `${MigrationScript110.name} - {${incentivesList.length}} Incentives to Update`,
    );
    await Promise.all(
      incentivesList.map(async (incentive: Incentive) => {
        const name: string = removeWhiteSpace(incentive.territoryName);

        const foundTerritory: Territory | undefined = createdTerritories.find(
          (territory: Territory) => territory.name.toLowerCase() === name.toLowerCase(),
        );

        if (foundTerritory) {
          await this.incentiveRepository.updateById(incentive.id, {
            territory: {
              id: foundTerritory?.id,
              name: foundTerritory?.name,
            },
            territoryName: foundTerritory?.name,
          });

          logger.info(
            `${MigrationScript110.name} - Incentive with ID \ ${
              incentive.id
            } is updated with territory : ${JSON.stringify(foundTerritory, null, 2)}`,
          );
          count++;
        } else {
          logger.error(
            `${MigrationScript110.name} - Incentive with ID ${incentive.id} is not updating`,
          );
        }
      }),
    );

    logger.info(`${MigrationScript110.name} - {${count}} Incentives are updated`);
    if (count !== incentivesList.length) {
      logger.error(`${MigrationScript110.name} - Error in updating incentives`);
    }
    logger.info(`${MigrationScript110.name} - Completed`);
  }
}
