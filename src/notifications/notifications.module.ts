import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesModule } from 'src/devices/devices.module';
import { IntegrationsModule } from 'src/integrations/integrations.module';
import { EMAIL_QUEUE, PUSH_QUEUE } from 'src/shared/config/index.config';
import { EmailWorkerProcessor } from 'src/workers/email.worker';
import { PushWorkerProcessor } from 'src/workers/push.worker';
import { Notification } from './entity/notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    BullModule.registerQueue({ name: EMAIL_QUEUE }, { name: PUSH_QUEUE }),
    IntegrationsModule,
    DevicesModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailWorkerProcessor, PushWorkerProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule {}
