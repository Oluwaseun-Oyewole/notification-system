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

    const activeTokens = await this.devicesService.getActiveTokensByUserId(
      notification.userId,
    );

    if (!activeTokens.length) {
      await this.notificationRepository.update(
        { id: notificationId },
        {
          status: NotificationStatus.FAILED,
          failureReason: 'No active push device token found for user',
        },
      );
    }
    const result = await this.pushService.send({
      channel: notification.channel,
      recipient: activeTokens[0].token,
      title,
      body,
      data,
    });

    console.log({ result });

    // const result = await this.pushService.sendMulticast({
    //   tokens: activeTokens.map((token) => token.token),
    //   title,
    //   body,
    //   data,
    // });

    // if (result.invalidTokens.length) {
    //   await this.devicesService.deactivateByToken(result.invalidTokens[0]);
    // }

    // if (result.successCount === 0) {
    //   throw new Error('Push provider did not deliver to any target token');
    // }
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

    const notification = await this.notificationRepository.findOne({
      where: { id: job.data.notificationId },
    });

    if (!notification) {
      return;
    }

    await this.notificationRepository.update(job.data.notificationId, {
      status: NotificationStatus.FAILED,
      retryCount: notification.retryCount + 1,
      failureReason: error instanceof Error ? error.message : String(error),
    });
  }
}
