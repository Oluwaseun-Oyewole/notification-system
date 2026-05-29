import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EMAIL_QUEUE, PUSH_QUEUE } from 'src/shared/config/index.config';
import { OutboxEvent } from './entity/outbox-event.entity';
import { OutboxEventPollerService } from './outbox-event.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([OutboxEvent]),
    BullModule.registerQueue({ name: EMAIL_QUEUE }, { name: PUSH_QUEUE }),
  ],
  providers: [OutboxEventPollerService],
})
export class OutboxEventModule {}
