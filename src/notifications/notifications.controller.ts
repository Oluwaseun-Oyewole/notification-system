import { Body, Controller, Headers, Post } from '@nestjs/common';
import { NOTIFICATION_QUEUE } from 'src/shared/config/index.config';
import { SuccessMessage } from 'src/shared/decorators/success.message.decorator';
import { BadRequestException } from 'src/shared/exceptions/domain.exceptions';
import { SendNotificationDto } from './dto/Notification.dto';
import { NotificationsService } from './notifications.service';

@Controller(NOTIFICATION_QUEUE)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @SuccessMessage('Notification processing started')
  async sendNotification(
    @Body() notificationDto: SendNotificationDto,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    if (!idempotencyKey) {
      throw new BadRequestException(
        'Idempotency key is required in x-idempotency-key header',
      );
    }

    // if (!isUUID(idempotencyKey)) {
    //   throw new BadRequestException('Idempotency key must be a valid UUID');
    // }
    return this.notificationsService.sendNotification(
      notificationDto,
      idempotencyKey,
    );
  }
}
