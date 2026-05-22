import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { MailService } from 'src/integrations/mail/mail.service';
import {
  Notification,
  NotificationStatus,
} from 'src/notifications/entity/notification.entity';
import { NOTIFICATION_QUEUE } from 'src/shared/config/index.config';
import { Not, Repository } from 'typeorm';

export interface EmailJobPayload {
  notificationId: string;
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

@Processor(NOTIFICATION_QUEUE, { concurrency: 5 })
export class EmailWorkerProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailWorkerProcessor.name);
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly mailService: MailService,
  ) {
    super();
  }

  async process(job: Job<EmailJobPayload>) {
    const { notificationId, to, subject, template, context } = job.data;

    const claim = await this.notificationRepository.update(
      { id: notificationId, status: Not(NotificationStatus.SENT) },
      { status: NotificationStatus.IN_PROGRESS },
    );

    if (claim.affected === 0) {
      this.logger.log(
        `Notification ${notificationId} already sent/claimed — skipping job ${job.id}`,
      );
      return;
    }

    try {
      await this.mailService.send({ to, subject, template, context });
    } catch (error) {
      // Revert to QUEUED so BullMQ retry picks it up cleanly
      await this.notificationRepository.update(
        { id: notificationId },
        { status: NotificationStatus.QUEUED },
      );
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<EmailJobPayload>) {
    const { notificationId } = job.data;
    await this.notificationRepository.update(
      { id: notificationId },
      { status: NotificationStatus.SENT, sentAt: new Date() },
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<EmailJobPayload>, error: Error) {
    console.log(job.attemptsMade, job.opts.attempts);
    const isFinalAttempt = job.attemptsMade >= job.opts.attempts - 1;

    if (!isFinalAttempt) {
      console.log(
        `Job ${job.id} failed on attempt ${job.attemptsMade}, will retry...`,
      );
      return;
    }

    const { notificationId } = job.data;
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
