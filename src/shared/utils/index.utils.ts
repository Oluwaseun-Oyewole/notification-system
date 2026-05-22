import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';

export const generateLongToken = (): string => {
  const token = crypto.randomBytes(3).toString('hex');
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return hash;
};
