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
  description = 'add identity and personal information object to citizen';

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

    // Update all citizens to add identity and personalnformation object
    const citizens: Array<AnyObject> = await this.citizenMigrationRepository.find({
      where: {or: [{identity: {exists: false}}, {personalInformation: {exists: false}}]},
    });

    logger.info(
      `${MigrationScript111.name} - Citizen ${citizens.length} will be updated`,
    );

    const updateCitizens: Promise<void>[] = citizens.map(async citizen => {
      const citizenName: string = citizen.lastName ?? citizen.identity?.lastName?.value;
      let citizenGender = citizen.gender === GENDER.FEMALE ? 2 : 1;
      if (citizen.gender) {
        citizenGender = citizen.gender === GENDER.FEMALE ? 2 : 1;
      } else if (citizen.identity.gender.value) {
        citizenGender = citizen.identity.gender.value;
      }
      logger.info(
        `${MigrationScript111.name} - Citizen ${citizenName} with ID \
        ${citizen.id} will be updated with identity and personal information object`,
      );

      logger.info(
        `${MigrationScript111.name} - Citizen ${citizenName} with ID \
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
            value: citizenGender,
            source: certificationSource,
            certificationDate: new Date(),
          },
          lastName: {
            value: citizen.lastName ?? citizen.identity?.lastName?.value,
            source: certificationSource,
            certificationDate: new Date(),
          },
          firstName: {
            value: citizen.firstName ?? citizen.identity?.firstName?.value,
            source: certificationSource,
            certificationDate: new Date(),
          },
          birthDate: {
            value: citizen.birthdate ?? citizen.identity?.birthDate?.value,
            source: certificationSource,
            certificationDate: new Date(),
          },
        },
        personalInformation: {
          email: {
            value: citizen.email ?? citizen.personalInformation?.email?.value,
            source: certificationSource,
            certificationDate: new Date(),
          },
        },
      };

      delete newCitizen.gender;
      delete newCitizen.lastName;
      delete newCitizen.firstName;
      delete newCitizen.birthdate;
      delete newCitizen?.email;
      delete newCitizen?.certifiedData;

      // Update the citizen attributes on KC
      logger.info(
        `${MigrationScript111.name} - Citizen ${citizenName} with ID \
        ${citizen.id} will be updated on KC with identity and personalInformation attributes`,
      );

      await this.kcService.updateCitizenAttributes(citizen.id, {
        ...newCitizen.identity,
        ...newCitizen.personalInformation,
      });

      // Update the citizen on mongo
      logger.info(
        `${MigrationScript111.name} - Citizen ${citizenName} with ID \
        ${citizen.id} will be updated on Mongo with identity and personalInformation object`,
      );

      return this.citizenRepository.replaceById(citizen.id, newCitizen);
    });
    await Promise.all(updateCitizens);

    logger.info(`${MigrationScript111.name} - Completed`);
  }
}
