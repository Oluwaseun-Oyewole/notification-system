import { Module } from '@nestjs/common';
import { FcmProvider } from './providers/fcm.provider';
import { PushService } from './push.service';

@Module({
  providers: [
    PushService,
    FcmProvider,
    // {
    //   provide: PUSH_PROVIDER_CLIENT,
    //   useClass: NoopPushProvider,
    // },
  ],
  exports: [PushService],
})
export class PushModule {}
