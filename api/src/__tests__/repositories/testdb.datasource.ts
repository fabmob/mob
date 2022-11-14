import {juggler} from '@loopback/repository';

export const testdbMongo: juggler.DataSource = new juggler.DataSource({
  name: 'mongoDS',
  connector: 'memory',
});

export const testdbPostgres: juggler.DataSource = new juggler.DataSource({
  name: 'idpdbDS',
  connector: 'memory',
});
