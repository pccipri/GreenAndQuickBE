import crypto from 'crypto';
import { ENCRYPTION_KEY } from '..';

const IV_LENGTH = 16;

const generateKey = (key: string): Buffer => {
  return crypto.createHash('sha256').update(key).digest();
};

export const encrypt = (text: string): string => {
  const key = generateKey(ENCRYPTION_KEY);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

export const decrypt = (text: string): string => {
  const key = generateKey(ENCRYPTION_KEY);
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift() || '', 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf8');
};

export const isPasswordValid = (
  inputPassword: string,
  storedEncryptedPassword: string,
): boolean => {
  const decryptedPassword = decrypt(storedEncryptedPassword);
  return inputPassword === decryptedPassword;
};
