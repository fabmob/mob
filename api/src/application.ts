import {BootMixin} from '@loopback/boot';
import {ApplicationConfig, BindingScope, createBindingFromClass} from '@loopback/core';
import {RestExplorerBindings, RestExplorerComponent} from '@loopback/rest-explorer';
import {RepositoryMixin} from '@loopback/repository';
import {Request, Response, RestApplication, RestBindings} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {UserIdSequence} from './sequence';
import {AuthenticationComponent, registerAuthenticationStrategy} from '@loopback/authentication';
import {AuthorizationComponent, AuthorizationTags} from '@loopback/authorization';
export {ApplicationConfig};
import {InfoObject, mergeOpenAPISpec} from '@loopback/openapi-v3';
import {CronComponent} from '@loopback/cron';
import {MigrationBindings, MigrationComponent} from 'loopback4-migration';
import morgan from 'morgan';

import {SECURITY_SCHEME_SPEC} from './utils/security-spec';
import {OPENAPI_CONFIG} from './constants';
import {ApiKeyAuthenticationStrategy} from './strategies';
import {KeycloakAuthenticationStrategy} from './strategies/keycloak.strategy';
import {AuthorizationProvider} from './providers/authorization.provider';
import {ParentProcessService} from './services';
import {MongoDsDataSource} from './datasources';
import {LoggerProvider} from './providers';
import {Logger} from './utils';
import {LoggerBindings} from './keys';
import {
  RabbitmqCronJob,
  SubscriptionCronJob,
  NonActivatedAccountDeletionCronJob,
  InactiveAccountNotificationCronJob,
  InactiveAccountDeletionCronJob,
} from './cronjob';
import {MigrationScript1212} from './migrations/1.21.2.migration';

export class App extends BootMixin(ServiceMixin(RepositoryMixin(RestApplication))) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    this.bind(LoggerBindings.LOGGER).toClass(Logger);
    this.bind(RestBindings.SequenceActions.LOG_ERROR).toProvider(LoggerProvider);

    this.bind(RestBindings.REQUEST_BODY_PARSER_OPTIONS).to({
      $data: true,
      validation: {
        keywords: ['example'],
      },
    });

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
    this.sequence(UserIdSequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));
    // Configure migration componentcd
    this.bind(MigrationBindings.CONFIG).to({
      appVersion: '1.21.2',
      dataSourceName: MongoDsDataSource.dataSourceName,
      modelName: 'Migration',
      migrationScripts: [MigrationScript1212],
    });
    // Bind migration component related elements
    this.component(MigrationComponent);

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
      indexTemplatePath: path.resolve(__dirname, '../explorer/index.html.ejs'),
      indexTitle: 'API Explorer | Mon Compte Mobilité',
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

    // Init cron component and cron jobs
    this.component(CronComponent);
    this.add(createBindingFromClass(RabbitmqCronJob));
    this.add(createBindingFromClass(SubscriptionCronJob));
    this.add(createBindingFromClass(NonActivatedAccountDeletionCronJob));
    this.add(createBindingFromClass(InactiveAccountNotificationCronJob));
    this.add(createBindingFromClass(InactiveAccountDeletionCronJob));

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

    this.setupLogging();
  }

  /**
   * Setup morgan middleware to log incoming request
   */
  private setupLogging() {
    const logLevel: string = process.env.LOG_LEVEL || 'info';
    // Create morgan token local date to be iso with winston
    morgan.token('local-date', function () {
      return new Date().toISOString();
    });

    // Create morgan token log level to be iso with winston
    morgan.token('level', function (req: Request, res: Response) {
      if (res.statusCode >= 400) {
        return 'error';
      }
      return 'info';
    });

    // Create custom morgan format
    const morganFormat: string = '[:local-date][:level][:status][:method][:total-time ms] :url';

    const defaultConfig: morgan.Options<Request, Response> = {
      skip: function (req: Request, res: Response) {
        if (req.baseUrl.includes('explorer') || req.url.includes('explorer')) {
          return true;
        }
        if (logLevel === 'error') {
          return res.statusCode <= 400;
        }
        return false;
      },
    };
    const morganFactory = (config?: morgan.Options<Request, Response>) => morgan(morganFormat, config);
    this.expressMiddleware(morganFactory, defaultConfig, {
      injectConfiguration: 'watch',
      key: 'middleware.morgan',
    });
  }
}
