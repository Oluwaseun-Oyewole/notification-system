import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';
import { JWTPayload } from 'src/auth/auth.interface';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SuccessMessage } from 'src/shared/decorators/success.message.decorator';
import { CurrentUser } from 'src/shared/decorators/user.decorator';
import { DevicesService } from './devices.service';
import {
  RegisterDeviceTokenDto,
  RemoveDeviceByIdDto,
} from './dto/device-token.dto';

@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('push-token')
  @SuccessMessage('Device token registered')
  async registerToken(
    @CurrentUser() user: JWTPayload,
    @Body() dto: RegisterDeviceTokenDto,
  ) {
    return this.devicesService.registerToken(user.id, dto);
  }

  @Delete('push-token')
  @SuccessMessage('Device token removed')
  async removeToken(
    @CurrentUser() user: JWTPayload,
    @Body() dto: RemoveDeviceByIdDto,
  ) {
    return this.devicesService.unregister(dto.id, user.id);
  }
}
