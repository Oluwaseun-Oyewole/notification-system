import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  DevicePlatform,
  NotificationChannel,
} from 'src/shared/enums/index.enums';

export class RegisterDeviceTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsEnum(DevicePlatform)
  platform: DevicePlatform;

  @IsEnum(NotificationChannel)
  @IsOptional()
  provider?: NotificationChannel;
}

export class RemoveDeviceTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class RemoveDeviceByIdDto {
  @IsString()
  @IsNotEmpty()
  id: string;
}
