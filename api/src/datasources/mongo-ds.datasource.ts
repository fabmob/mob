import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

const configTesting = {
  name: 'mongoDS',
  connector: 'mongodb',
  url: `mongodb+srv://${process.env.MONGO_SERVICE_USER}:${process.env.MONGO_SERVICE_PASSWORD}@${process.env.MONGO_HOST}/${process.env.MONGO_DATABASE}?retryWrites=true&w=majority`,
};

const configPreview = {
  name: 'mongoDS',
  connector: 'mongodb',
  host: process.env.MONGO_HOST ?? 'localhost',
  port: process.env.MONGO_PORT ?? 27017,
  user: process.env.MONGO_SERVICE_USER ?? 'admin',
  password: process.env.MONGO_SERVICE_PASSWORD ?? 'pass',
  database: process.env.MONGO_DATABASE ?? 'mcm',
  authSource: process.env.MONGO_AUTH_SOURCE ?? 'admin',
  useNewUrlParser: true,
  allowExtendedOperators: true,
};

const config =
  process.env.LANDSCAPE && process.env.LANDSCAPE === 'testing'
    ? configTesting
    : configPreview;

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
