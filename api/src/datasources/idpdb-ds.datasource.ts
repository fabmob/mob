import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

const config = {
  name: 'idpdbDS',
  connector: 'postgresql',
  host: process.env.IDP_DB_HOST ?? 'localhost',
  port: process.env.IDP_DB_PORT ?? 5432,
  user: process.env.IDP_DB_SERVICE_USER ?? 'admin',
  password: process.env.IDP_DB_SERVICE_PASSWORD ?? 'pass',
  database: process.env.IDP_DB_DATABASE ?? 'idp_db',
  ssl:
    process.env.LANDSCAPE && process.env.LANDSCAPE !== 'preview'
      ? {
          rejectUnauthorized: true,
          ca: Buffer.from(process.env.PGSQL_FLEX_SSL_CERT!, 'base64').toString('utf-8'),
        }
      : null,
};

@lifeCycleObserver('datasource')
export class IdpDbDataSource extends juggler.DataSource implements LifeCycleObserver {
  static dataSourceName = 'idpdbDS';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.idpdbDS', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
