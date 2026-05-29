import { Injectable } from '@nestjs/common';
import {
  NotificationChannel,
  NotificationPayload,
  NotificationProvider,
} from 'src/shared/enums/index.enums';
import { FcmProvider } from './providers/fcm.provider';

@Injectable()
export class PushService {
  private readonly providers: Map<NotificationChannel, NotificationProvider>;

  constructor(private readonly fcm: FcmProvider) {
    this.providers = new Map([[NotificationChannel.FCM, this.fcm]]);
  }

  async send(payload: NotificationPayload): Promise<void> {
    const provider = this.providers.get(payload.channel);

    if (!provider) {
      throw new Error(`No provider registered for channel: ${payload.channel}`);
    }

    await provider.send(payload);
  }
}
