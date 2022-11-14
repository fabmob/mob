import * as crypto from 'crypto';
import {expect} from '@loopback/testlab';
import {encryptAESKey, encryptFileHybrid, generateAESKey} from '../../utils/encryption';

describe('encryption service', () => {
  it('should generate AES key', function () {
    const checkKey = crypto.randomBytes(32);
    const checkIV = crypto.randomBytes(16);
    const generateKey = generateAESKey();
    expect(generateKey).to.not.equal({key: checkKey, iv: checkIV});
  });

  it('should encrypt AES key', function () {
    const checkKey = crypto.randomBytes(32);
    const checkIV = crypto.randomBytes(16);
    const encryptedKey = encryptAESKey(publicKey, checkKey, checkIV);
    expect(encryptedKey).to.not.equal({key: checkKey, iv: checkIV});
  });

  it('should encrypt the file', function () {
    const file = Buffer.from('File test');
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const encryptedFile = encryptFileHybrid(file, key, iv);
    expect(encryptedFile).to.not.equal(file);
  });
});

const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApkUKTww771tjeFsYFCZq
n76SSpOzolmtf9VntGlPfbP5j1dEr6jAuTthQPoIDaEed6P44yyL3/1GqWJMgRbf
n8qqvnu8dH8xB+c9+er0tNezafK9eK37RqzsTj7FNW2Dpk70nUYncTiXxjf+ofLq
sokEIlp2zHPEZce2o6jAIoFOV90MRhJ4XcCik2w3IljxdJSIfBYX2/rDgEVN0T85
OOd9ChaYpKCPKKfnpvhjEw+KdmzUFP1u8aao2BNKyI2C+MHuRb1wSIu2ZAYfHgoG
X6FQc/nXeb1cAY8W5aUXOP7ITU1EtIuCD8WuxXMflS446vyfCmJWt+OFyveqgJ4n
owIDAQAB
-----END PUBLIC KEY-----
`;
