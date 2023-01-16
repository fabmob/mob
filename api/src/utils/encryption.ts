import * as crypto from 'crypto';

const AES_ALGORITHM = 'AES-256-CBC';

export const generateAESKey = (): {key: Buffer; iv: Buffer} => {
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  return {key, iv};
};

export const encryptAESKey = (publicKey: string, key: Buffer, iv: Buffer) => {
  const encryptKey = crypto.publicEncrypt(publicKey, Buffer.from(key));
  const encryptIV = crypto.publicEncrypt(publicKey, Buffer.from(iv));
  return {encryptKey, encryptIV};
};

export const encryptFileHybrid = (file: Buffer, key: Buffer, iv: Buffer) => {
  const cipher = crypto.createCipheriv(AES_ALGORITHM, key, iv);
  const encryptedFile: Buffer = Buffer.concat([cipher.update(file), cipher.final()]);
  return encryptedFile;
};

/**
 * hash data with sha256
 * @param data data to hash
 * @returns hashed data
 */
export const sha256 = (data: object) => {
  return crypto.createHash('sha256').update(`${data}`).digest('hex');
};
