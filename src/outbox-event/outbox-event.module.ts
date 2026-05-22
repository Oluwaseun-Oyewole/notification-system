import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NOTIFICATION_QUEUE } from 'src/shared/config/index.config';
import { OutboxEvent } from './entity/outbox-event.entity';
import { OutboxEventPollerService } from './outbox-event.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([OutboxEvent]),
    BullModule.registerQueue({ name: NOTIFICATION_QUEUE }),
  ],
  providers: [OutboxEventPollerService],
})
export class OutboxEventModule {}
