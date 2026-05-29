import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  NotificationChannel,
  NotificationType,
} from 'src/shared/enums/index.enums';

export class SendNotificationDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @IsEnum(NotificationChannel)
  @IsOptional()
  channel?: NotificationChannel;

  @IsString()
  @IsOptional()
  failureReason?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;
}

export class EmailPayloadDto {
  @IsEmail()
  to: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  body?: string | Record<string, any>;

  @IsOptional()
  @IsObject()
  context?: Record<string, any>;

  @IsOptional()
  template?: string;
}

export class PushPayloadDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}
