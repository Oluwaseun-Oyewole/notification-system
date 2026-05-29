import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EventType,
  OutboxEvent,
  OutboxEventStatus,
} from 'src/outbox-event/entity/outbox-event.entity';
import { NotificationStatus } from 'src/shared/enums/index.enums';
import { DataSource, Repository } from 'typeorm';
import { SendNotificationDto } from './dto/Notification.dto';
import { Notification } from './entity/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,

    private readonly dataSource: DataSource,
  ) {}

  async sendNotification(dto: SendNotificationDto, idempotencyKey: string) {
    const existing = await this.notificationRepository.findOne({
      where: { correlationId: idempotencyKey },
    });

    if (existing) {
      if (existing.status !== NotificationStatus.FAILED) {
        return existing;
      }
      return this.retryFailedNotification(existing, dto);
    }

    return this.createAndScheduleNotification(dto, idempotencyKey);
  }

  private async createAndScheduleNotification(
    dto: SendNotificationDto,
    idempotencyKey: string,
  ) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const notification = manager.create(Notification, {
          ...dto,
          correlationId: idempotencyKey,
          status: NotificationStatus.PENDING,
        });
        await manager.save(Notification, notification);

        const outboxEvent = manager.create(OutboxEvent, {
          notificationId: notification.id,
          eventType: EventType.SEND_NOTIFICATION,
          status: OutboxEventStatus.PENDING,
          payload: {
            notificationId: notification.id,
            channel: notification.channel,
            payload: dto.payload,
          },
        });
        await manager.save(OutboxEvent, outboxEvent);

        return notification;
      });
    } catch (error: any) {
      if (error?.code === '23505') {
        return this.notificationRepository.findOne({
          where: { correlationId: idempotencyKey },
        });
      }
      throw error;
    }
  }

  private async retryFailedNotification(
    notification: Notification,
    dto: SendNotificationDto,
  ) {
    await this.dataSource.transaction(async (manager) => {
      await manager.update(Notification, notification.id, {
        status: NotificationStatus.PENDING,
        failureReason: null,
        retryCount: 0,
      });
      const outboxEvent = manager.create(OutboxEvent, {
        notificationId: notification.id,
        eventType: EventType.SEND_NOTIFICATION,
        status: OutboxEventStatus.PENDING,
        payload: {
          notificationId: notification.id,
          channel: notification.channel,
          payload: dto.payload,
        },
      });
      await manager.save(OutboxEvent, outboxEvent);
    });

    return this.notificationRepository.findOne({
      where: { id: notification.id },
    });
  }
}
