import * as argon2 from 'argon2';
import * as crypto from 'node:crypto';

export const generateLongToken = (): string => {
  const token = crypto.randomBytes(3).toString('hex');
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const hashPassword = async (password: string) => {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
};
