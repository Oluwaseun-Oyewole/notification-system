import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { EmailPayloadDto } from 'src/notifications/dto/Notification.dto';
import {
  Notification,
  NotificationChannel,
  NotificationStatus,
} from 'src/notifications/entity/notification.entity';
import { EMAIL_JOB, NOTIFICATION_QUEUE } from 'src/shared/config/index.config';
import { DataSource, Repository } from 'typeorm';
import { OutboxEvent, OutboxEventStatus } from './entity/outbox-event.entity';

const BATCH_SIZE = 50;

@Injectable()
export class OutboxEventPollerService {
  private isPolling = false;
  constructor(
    @InjectRepository(OutboxEvent)
    private readonly outboxRepository: Repository<OutboxEvent>,

    @InjectQueue(NOTIFICATION_QUEUE)
    private readonly notificationQueue: Queue,

    private readonly dataSource: DataSource,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async pollOutbox() {
    if (this.isPolling) return;
    this.isPolling = true;

    try {
      const events = await this.outboxRepository.find({
        where: { status: OutboxEventStatus.PENDING },
        order: { createdAt: 'ASC' },
        take: BATCH_SIZE,
      });
      await Promise.allSettled(events.map((event) => this.processJob(event)));
    } finally {
      this.isPolling = false;
    }
  }

  private async processJob(event: OutboxEvent) {
    try {
      const { notificationId, channel, payload } = event.payload as {
        notificationId: string;
        channel: NotificationChannel;
        payload: any;
      };

      if (channel === NotificationChannel.EMAIL) {
        await this.enqueueEmail(notificationId, payload as EmailPayloadDto);
      }

      await this.dataSource.transaction(async (manager) => {
        await manager.update(OutboxEvent, event.id, {
          status: OutboxEventStatus.PROCESSED,
          processedAt: new Date(),
        });
        await manager.update(
          Notification,
          { id: notificationId },
          {
            status: NotificationStatus.QUEUED,
          },
        );
      });
    } catch (error) {
      await this.outboxRepository.update(event.id, {
        status: OutboxEventStatus.FAILED,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  private async enqueueEmail(notificationId: string, payload: EmailPayloadDto) {
    if (!payload.template) {
      return;
    }

    // const context =
    //   payload.body && typeof payload.body === 'object'
    //     ? (payload.body as Record<string, any>)
    //     : { message: String(payload.body ?? '') };

    const queuePayloads = {
      notificationId,
      to: payload.to,
      subject: payload.subject,
      template: payload.template ?? 'welcome',
      context: payload.context,
    };

    await this.notificationQueue.add(
      EMAIL_JOB,
      {
        ...queuePayloads,
      },
      { attempts: 3 },
    );
  }
}
