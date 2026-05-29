import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as admin from 'firebase-admin';
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

export const convertDataToString = (data?: Record<string, any>) => {
  if (!data) {
    return undefined;
  }

  return Object.entries(data).reduce((acc, [key, value]) => {
    acc[key] = typeof value === 'string' ? value : JSON.stringify(value);
    return acc;
  }, {});
};

export const firebaseAdminProvider = {
  provide: 'FIREBASE_ADMIN',
  useFactory: (configService: ConfigService) => {
    const defaultApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: configService.get<string>('PROJECT_ID'),
        clientEmail: configService.get<string>('CLIENT_EMAIL'),
        privateKey: configService
          .get<string>('PRIVATE_KEY')
          ?.replace(/\\n/g, '\n'),
      }),
    });

    return { defaultApp };
  },
  // inject: [ConfigService],
};
