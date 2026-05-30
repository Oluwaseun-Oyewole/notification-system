import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NOTIFICATION_QUEUE } from 'src/shared/config/index.config';
import { CurrentUser } from 'src/shared/decorators/user.decorator';
import { BadRequestException } from 'src/shared/exceptions/domain.exceptions';
import { ResponseBuilder } from 'src/shared/utils/api-response.builder';
import { SendNotificationDto } from './dto/Notification.dto';
import { NotificationsService } from './notifications.service';

@Controller(NOTIFICATION_QUEUE)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async sendNotification(
    @CurrentUser() user,
    @Body() notificationDto: SendNotificationDto,
    @Headers('x-idempotency-key') idempotencyKey: string,
  ) {
    const dto = {
      ...notificationDto,
      userId: user.sub,
    };

    if (!idempotencyKey) {
      throw new BadRequestException(
        'Idempotency key is required in x-idempotency-key header',
      );
    }

    if (!isUUID(idempotencyKey)) {
      throw new BadRequestException('Idempotency key must be a valid UUID');
    }
    const resp = await this.notificationsService.sendNotification(
      dto,
      idempotencyKey,
    );
    return ResponseBuilder.created(resp, 'Notification processing started');
  }
}
