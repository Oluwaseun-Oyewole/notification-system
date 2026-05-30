import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import {
  NotificationChannel,
  NotificationPayload,
} from 'src/shared/enums/index.enums';

@Injectable()
export class FcmProvider implements OnModuleInit {
  readonly channel = NotificationChannel.FCM;
  private app: admin.app.App;
  private readonly logger = new Logger(FcmProvider.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    if (admin.apps.length) return;

    const privateKey = this.config
      .get<string>('PRIVATE_KEY')
      ?.replace(/\\n/g, '\n');

    this.app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: this.config.get<string>('PROJECT_ID'),
        clientEmail: this.config.get<string>('CLIENT_EMAIL'),
        privateKey: privateKey,
      }),
    });

    this.logger.log('Firebase Admin SDK initialized');
  }

  async send(payload: NotificationPayload) {
    const message = {
      token: payload.recipient,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
      //   android: {
      //     priority: 'high',
      //     notification: {
      //       sound: 'default',
      //       channelId: 'default',
      //     },
      //   },
      //   apns: {
      //     headers: {
      //       'apns-priority': '10',
      //     },
      //     payload: {
      //       aps: {
      //         contentAvailable: true,
      //         sound: 'default',
      //       },
      //     },
      //   },
    };
    try {
      const response = await this.app.messaging().send(message);
      this.logger.log(`FCM message sent successfully: ${response}`);
    } catch (error) {
      this.logger.error('Error sending FCM message', error);
      throw error;
    }
  }
}
