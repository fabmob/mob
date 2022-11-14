import {AnyObject, repository} from '@loopback/repository';
import {inject} from '@loopback/core';
import {MigrationScript, migrationScript} from 'loopback4-migration';

import {KeycloakService} from '../services';
import {CitizenMigrationRepository, CitizenRepository} from '../repositories';
import {logger, GENDER, IUser} from '../utils';

@migrationScript()
export class MigrationScript111 implements MigrationScript {
  version = '1.11.0';
  scriptName = MigrationScript111.name;
  description = 'add identity object to citizen';

  constructor(
    @repository(CitizenRepository)
    private citizenRepository: CitizenRepository,
    @repository(CitizenMigrationRepository)
    private citizenMigrationRepository: CitizenMigrationRepository,
    @inject('services.KeycloakService')
    public kcService: KeycloakService,
  ) {}

  async up(): Promise<void> {
    logger.info(`${MigrationScript111.name} - Started`);

    // Update all citizens to add identity object
    const citizens: Array<AnyObject> = await this.citizenMigrationRepository.find({
      where: {identity: {exists: false}},
    });

    const updateCitizens: Promise<void>[] = citizens.map(async citizen => {
      logger.info(
        `${MigrationScript111.name} - Citizen ${citizen.lastName} with ID \
        ${citizen.id} will be updated with identity object`,
      );

      logger.info(
        `${MigrationScript111.name} - Citizen ${citizen.lastName} with ID \
        ${citizen.id} Get User Information for certification source`,
      );

      const user: IUser = await this.kcService.getUser(citizen.id);

      const certificationSource: string =
        user?.attributes?.provider?.[0] === 'FC'
          ? 'franceconnect.gouv.fr'
          : 'moncomptemobilite.fr';

      const newCitizen: AnyObject = {
        ...citizen,
        identity: {
          gender: {
            value: citizen.gender === GENDER.FEMALE ? 2 : 1,
            source: certificationSource,
            certificationDate: new Date(),
          },
          lastName: {
            value: citizen.lastName,
            source: certificationSource,
            certificationDate: new Date(),
          },
          firstName: {
            value: citizen.firstName,
            source: certificationSource,
            certificationDate: new Date(),
          },
          birthDate: {
            value: citizen.birthdate,
            source: certificationSource,
            certificationDate: new Date(),
          },
        },
      };

      delete newCitizen.gender;
      delete newCitizen.lastName;
      delete newCitizen.firstName;
      delete newCitizen.birthdate;
      delete newCitizen?.certifiedData;

      // Update the citizen attributes on KC
      logger.info(
        `${MigrationScript111.name} - Citizen ${citizen.lastName} with ID \
        ${citizen.id} will be updated on KC with identity attributes`,
      );

      await this.kcService.updateCitizenAttributes(citizen.id, {
        ...newCitizen.identity,
      });

      // Update the citizen on mongo
      logger.info(
        `${MigrationScript111.name} - Citizen ${citizen.lastName} with ID \
        ${citizen.id} will be updated on Mongo with identity object`,
      );

      return this.citizenRepository.replaceById(citizen.id, newCitizen);
    });
    await Promise.all(updateCitizens);

    logger.info(`${MigrationScript111.name} - Completed`);
  }
}
