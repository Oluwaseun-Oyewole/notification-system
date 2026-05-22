import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrationsModule } from 'src/integrations/integrations.module';
import { NOTIFICATION_QUEUE } from 'src/shared/config/index.config';
import { EmailWorkerProcessor } from 'src/workers/email.worker';
import { Notification } from './entity/notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    BullModule.registerQueue({ name: NOTIFICATION_QUEUE }),
    IntegrationsModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailWorkerProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule {}
