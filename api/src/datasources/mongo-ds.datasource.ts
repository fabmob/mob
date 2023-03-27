import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

const protocol: string | undefined = process.env.MONGO_PROTOCOL;
const user: string | undefined = process.env.MONGO_SERVICE_USER;
const password: string | undefined = process.env.MONGO_SERVICE_PASSWORD;
const host: string | undefined = process.env.MONGO_HOST;
const port: string | undefined = process.env.MONGO_PORT;
const database: string | undefined = process.env.MONGO_DATABASE;
const source: string | undefined = process.env.MONGO_AUTH_SOURCE;
const landscape: string | undefined = process.env.LANDSCAPE;
const options: string | undefined = process.env.MONGO_OPTIONS;

const configProd = {
  name: 'mongoDS',
  connector: 'mongodb',
  url: `${protocol}://${user}:${password}@${host}/${database}${options}`,
};

const configPreview = {
  name: 'mongoDS',
  connector: 'mongodb',
  host: host ?? 'localhost',
  port: port ?? 27017,
  user: user ?? 'admin',
  password: password ?? 'pass',
  database: database ?? 'mcm',
  authSource: source ?? 'admin',
  useNewUrlParser: true,
  allowExtendedOperators: true,
};

const config = landscape && landscape !== 'preview' ? configProd : configPreview;

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class MongoDsDataSource extends juggler.DataSource implements LifeCycleObserver {
  static dataSourceName = 'mongoDS';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.mongoDS', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
