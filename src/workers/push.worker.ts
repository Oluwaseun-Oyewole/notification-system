import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { DevicesService } from 'src/devices/devices.service';
import { PushService } from 'src/integrations/push/push.service';
import { Notification } from 'src/notifications/entity/notification.entity';
import { PUSH_QUEUE } from 'src/shared/config/index.config';
import { NotificationStatus } from 'src/shared/enums/index.enums';
import { Not, Repository } from 'typeorm';

export interface PushJobPayload {
  notificationId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Processor(PUSH_QUEUE, { concurrency: 5 })
export class PushWorkerProcessor extends WorkerHost {
  private readonly logger = new Logger(PushWorkerProcessor.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly devicesService: DevicesService,
    private readonly pushService: PushService,
  ) {
    super();
  }

  async process(job: Job<PushJobPayload>) {
    const { notificationId, title, body, data } = job.data;

    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      this.logger.warn(`Notification ${notificationId} not found for push job`);
      return;
    }

    const notificationClaim = await this.notificationRepository.update(
      { id: notificationId, status: Not(NotificationStatus.SENT) },
      { status: NotificationStatus.IN_PROGRESS },
    );

    if (notificationClaim.affected === 0) {
      this.logger.log(
        `Notification ${notificationId} already sent/claimed, skipping push job ${job.id}`,
      );
      return;
    }

    const activeToken = await this.devicesService.getActiveTokenByUserId(
      notification.userId,
    );

    try {
      await this.pushService.send({
        channel: notification.channel,
        recipient: activeToken?.token,
        title,
        body,
        data,
      });
    } catch (error) {
      await this.notificationRepository.update(
        { id: notificationId },
        {
          status: NotificationStatus.QUEUED,
        },
      );
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<PushJobPayload>) {
    const { notificationId } = job.data;

    await this.notificationRepository.update(
      { id: notificationId },
      {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
        failureReason: null,
      },
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<PushJobPayload>, error: Error) {
    const isFinalAttempt = job.attemptsMade >= job.opts.attempts - 1;

    if (!isFinalAttempt) {
      this.logger.warn(
        `Push job ${job.id} failed on attempt ${job.attemptsMade}, retrying`,
      );
      await this.notificationRepository.update(
        { id: job.data.notificationId },
        { status: NotificationStatus.QUEUED },
      );
      return;
    }
    const notificationId = job.data.notificationId;

    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      return;
    }

    await this.notificationRepository.update(notificationId, {
      status: NotificationStatus.FAILED,
      retryCount: notification.retryCount + 1,
      failureReason: error instanceof Error ? error.message : String(error),
    });
  }
}
