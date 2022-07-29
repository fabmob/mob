import {BootMixin} from '@loopback/boot';
import {ApplicationConfig, createBindingFromClass} from '@loopback/core';
import {RestExplorerBindings, RestExplorerComponent} from '@loopback/rest-explorer';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication, RestBindings} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {MySequence} from './sequence';
import {
  AuthenticationComponent,
  registerAuthenticationStrategy,
} from '@loopback/authentication';
import {AuthorizationComponent, AuthorizationTags} from '@loopback/authorization';
export {ApplicationConfig};
import {InfoObject, mergeOpenAPISpec} from '@loopback/openapi-v3';
import {CronComponent} from '@loopback/cron';

import {SECURITY_SCHEME_SPEC} from './utils/security-spec';
import {OPENAPI_CONFIG} from './constants';
import {ApiKeyAuthenticationStrategy} from './strategies';
import {KeycloakAuthenticationStrategy} from './strategies/keycloak.strategy';
import {AuthorizationProvider} from './providers/authorization.provider';
import {RabbitmqCronJob} from './cronjob/rabbitmqCronJob';
import {SubscriptionCronJob} from './cronjob/subscriptionCronJob';
import {inactifAccountDeletionCronJob} from './cronjob/inactifAccountDeletionCronJob';
import {ParentProcessService} from './services';

export class App extends BootMixin(ServiceMixin(RepositoryMixin(RestApplication))) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    const infoObject: InfoObject = {
      title: OPENAPI_CONFIG.title,
      version: OPENAPI_CONFIG.version,
      contact: OPENAPI_CONFIG.contact,
    };

    this.api(
      mergeOpenAPISpec(this.getSync(RestBindings.API_SPEC), {
        info: infoObject,
        components: {
          securitySchemes: SECURITY_SCHEME_SPEC,
        },
      }),
    );

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    this.bind(RestBindings.ERROR_WRITER_OPTIONS).to({
      debug: false,
      safeFields: ['path', 'resourceName'],
    });
    this.component(AuthenticationComponent);
    this.component(AuthorizationComponent);
    this.bind('authorizationProviders.authorization-provider')
      .toProvider(AuthorizationProvider)
      .tag(AuthorizationTags.AUTHORIZER);

    registerAuthenticationStrategy(this, KeycloakAuthenticationStrategy);
    registerAuthenticationStrategy(this, ApiKeyAuthenticationStrategy);

    // Create binding for ParentProcessService to be used as unique instance
    // Please use @inject('services.ParentProcessService') if injection is needed in other classes
    this.add(createBindingFromClass(ParentProcessService));

    // Init cron component and RabbitmqCronJob
    this.component(CronComponent);
    this.add(createBindingFromClass(RabbitmqCronJob));
    // clean subscription collection
    this.add(createBindingFromClass(SubscriptionCronJob));
    this.add(createBindingFromClass(inactifAccountDeletionCronJob));

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js', '.controller.ts'],
        nested: true,
      },
    };
  }
}
