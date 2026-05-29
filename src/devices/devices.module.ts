import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { DeviceToken } from './entity/device-token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceToken])],
  providers: [DevicesService],
  controllers: [DevicesController],
  exports: [DevicesService, TypeOrmModule],
})
export class DevicesModule {}
