import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';
import { JWTPayload } from 'src/auth/auth.interface';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/shared/decorators/user.decorator';
import { ResponseBuilder } from 'src/shared/utils/api-response.builder';
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
  async registerToken(
    @CurrentUser() user: JWTPayload,
    @Body() dto: RegisterDeviceTokenDto,
  ) {
    const resp = await this.devicesService.registerToken(user.sub, dto);
    return ResponseBuilder.created(resp, 'Device token registered');
  }

  @Delete('push-token')
  async removeToken(
    @CurrentUser() user: JWTPayload,
    @Body() dto: RemoveDeviceByIdDto,
  ) {
    await this.devicesService.unregisterToken(dto.id, user.sub);
    return ResponseBuilder.noContent('Device token removed');
  }
}
