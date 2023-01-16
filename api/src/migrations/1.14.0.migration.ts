import {AnyObject} from '@loopback/repository';
import {inject} from '@loopback/core';
import {MigrationScript, migrationScript} from 'loopback4-migration';
import {logger} from '../utils';
import {KeycloakService} from '../services';
import KcAdminClient from 'keycloak-admin';
import {credentials, baseUrl, realmName} from '../constants';

@migrationScript()
export class MigrationScript1140 implements MigrationScript {
  version = '1.14.0';
  scriptName = MigrationScript1140.name;
  description = 'fix identity.birthDate for FC citizens';

  keycloakAdmin: KcAdminClient;

  constructor(
    @inject('services.KeycloakService')
    public kcService: KeycloakService,
  ) {
    this.keycloakAdmin = new KcAdminClient({
      baseUrl,
      realmName,
    });
  }

  async up(): Promise<void> {
    /**
     * Convert Date object to String
     *
     */
    const convertDateToString = (value: Date) => {
      if (!(value instanceof Date) || isNaN(value.getDate())) return '';
      const pad = '00';
      const yyyy = value.getFullYear().toString();
      const MM = (value.getMonth() + 1).toString();
      const dd = value.getDate().toString();
      return `${yyyy}-${(pad + MM).slice(-2)}-${(pad + dd).slice(-2)}`;
    };

    logger.info(`${MigrationScript1140.name} - Started`);
    // Update identity.birthDate for FC citizens object
    const citizens: Array<AnyObject> = await this.kcService.listUsers();

    logger.info(
      `${MigrationScript1140.name} - Citizen ${citizens.length} will be updated`,
    );

    const updateCitizens: Promise<void>[] = citizens.map(async citizen => {
      logger.info(
        `${MigrationScript1140.name} - Citizen with ID \
          ${citizen.id} will be updated`,
      );

      const newCitizen = {
        birthDate: {
          ...JSON.parse(citizen.attributes['identity.birthDate']),
          value: convertDateToString(
            new Date(JSON.parse(citizen.attributes['identity.birthDate']).value),
          ),
        },
      };

      const id: string = citizen.id;
      await this.keycloakAdmin
        .auth(credentials)
        .then(() =>
          this.keycloakAdmin.users.update(
            {id},
            {
              attributes: {
                ...citizen.attributes,
                'identity.birthDate': JSON.stringify(newCitizen?.birthDate),
              },
            },
          ),
        )
        .catch(err => err);
    });
    await Promise.allSettled(updateCitizens);

    logger.info(`${MigrationScript1140.name} - Completed`);
  }
}
