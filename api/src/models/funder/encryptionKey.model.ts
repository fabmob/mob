import {Model, model, property} from '@loopback/repository';
import {PrivateKeyAccess} from './privateKeyAccess.model';

@model({settings: {idInjection: false}})
export class EncryptionKey extends Model {
  @property({
    type: 'string',
    description: `Identifiant de la clé de chiffrement du financeur`,
    required: true,
    jsonSchema: {
      example: `1`,
      minLength: 1,
    },
  })
  id: string;

  @property({
    type: 'number',
    description: `Version de la clé de chiffrement du financeur`,
    required: true,
    jsonSchema: {
      example: 1,
    },
  })
  version: number;

  @property({
    type: 'string',
    description: `Clé publique du financeur`,
    required: true,
    jsonSchema: {
      example: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApkUKTww771tjeFsYFCZq
n76SSpOzolmtf9VntGlPfbP5j1dEr6jAuTthQPoIDaEed6P44yyL3/1GqWJMgRbf
n8qqvnu8dH8xB+c9+er0tNezafK9eK37RqzsTj7FNW2Dpk70nUYncTiXxjf+ofLq
sokEIlp2zHPEZce2o6jAIoFOV90MRhJ4XcCik2w3IljxdJSIfBYX2/rDgEVN0T85
OOd9ChaYpKCPKKfnpvhjEw+KdmzUFP1u8aao2BNKyI2C+MHuRb1wSIu2ZAYfHgoG
X6FQc/nXeb1cAY8W5aUXOP7ITU1EtIuCD8WuxXMflS446vyfCmJWt+OFyveqgJ4n
owIDAQAB
-----END PUBLIC KEY-----
`,
      minLength: 1,
    },
  })
  publicKey: string;

  @property({
    type: 'date',
    description: `Date d'expiration de la clé`,
    required: true,
    jsonSchema: {
      example: `2022-12-17T14:22:01Z`,
    },
  })
  expirationDate: Date;

  @property({
    type: 'date',
    description: `Date de la dernière mise à jour de la clé`,
    required: true,
    jsonSchema: {
      example: `2022-06-17T14:22:01Z`,
    },
  })
  lastUpdateDate: Date;

  @property()
  privateKeyAccess?: PrivateKeyAccess;

  constructor(data?: Partial<EncryptionKey>) {
    super(data);
  }
}

export interface EncryptionKeyRelations {
  // describe navigational properties here
}

export type EncryptionKeyWithRelations = EncryptionKey & EncryptionKeyRelations;
