import {BootMixin} from '@loopback/boot';
import {ApplicationConfig, createBindingFromClass} from '@loopback/core';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {RepositoryMixin} from '@loopback/repository';
import {mergeOpenAPISpec, RestApplication, RestBindings} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {MySequence} from './sequence';
import {AuthenticationComponent, registerAuthenticationStrategy} from '@loopback/authentication';
import { ApiKeyAuthenticationStrategy } from './strategies/api-key.strategy';
import {CronComponent} from '@loopback/cron';
import {
  HandlingCronJob,
} from './cronjob/handling.cronjob';


export {ApplicationConfig};

export class AfapastApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Set up the custom sequence
    this.sequence(MySequence);

    this.api(
      mergeOpenAPISpec(this.getSync(RestBindings.API_SPEC), {
        // info: infoObject,
        components: {
          securitySchemes: {
            ApiKey: {
              type: 'apiKey',
              name: 'X-API-Key',
              in: 'header',
            }
          },
        },
        security: [
          {
            ApiKey: [],
          },
        ],
      }),
    );

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    this.component(CronComponent);
    this.add(createBindingFromClass(HandlingCronJob));

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
    this.component(AuthenticationComponent);
    registerAuthenticationStrategy(this, ApiKeyAuthenticationStrategy);
  }
}
