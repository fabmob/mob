import {App} from './application';
import {Logger} from './utils';

export async function migrate(args: string[]) {
  const existingSchema = args.includes('--rebuild') ? 'drop' : 'alter';
  Logger.info('LB4', migrate.name, 'Migrating schemas (%s existing schema):', existingSchema);
  const app = new App();
  await app.boot();
  await app.migrateSchema({existingSchema});

  // Connectors usually keep a pool of opened connections,
  // this keeps the process running even after all work is done.
  // We need to exit explicitly.
  process.exit(0);
}

migrate(process.argv).catch(err => {
  Logger.error('LB4', migrate.name, `Cannot migrate database schema`, err.message);
  process.exit(1);
});
