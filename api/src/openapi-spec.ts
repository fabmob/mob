import {ApplicationConfig} from '@loopback/core';

import {App} from './application';
import {Logger} from './utils';

/**
 * Export the OpenAPI spec from the application
 */
async function exportOpenApiSpec(): Promise<void> {
  const config: ApplicationConfig = {
    rest: {
      port: +(process.env.PORT ?? 3000),
      host: process.env.HOST ?? 'localhost',
    },
  };
  const outFile = process.argv[2] ?? '';
  const app = new App(config);
  await app.boot();
  await app.exportOpenApiSpec(outFile);
}

exportOpenApiSpec().catch(err => {
  Logger.error('LB4', 'exportOpenApiSpec', 'Fail to export OpenAPI spec from the application', err);

  process.exit(1);
});
