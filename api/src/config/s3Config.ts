import {S3ClientConfig} from '@aws-sdk/client-s3';

export class S3Config {
  protected getConfiguration(): S3ClientConfig {
    return {
      credentials: {
        accessKeyId: process.env.S3_SERVICE_USER ?? 'minioadmin',
        secretAccessKey: process.env.S3_SERVICE_PASSWORD ?? 'minioadmin',
      },
      region: 'us-east-1',
      endpoint:
        process.env.S3_HOST && process.env.S3_PORT
          ? `http://${process.env.S3_HOST}:${process.env.S3_PORT}`
          : 'http://localhost:9001',
      forcePathStyle: true,
    };
  }
}
