import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ResourceNotFoundException } from 'src/shared/exceptions/domain.exceptions';
import { DataSource, Repository } from 'typeorm';
import { RegisterDeviceTokenDto } from './dto/device-token.dto';
import { DeviceToken } from './entity/device-token.entity';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(DeviceToken)
    private readonly deviceTokenRepository: Repository<DeviceToken>,
    private readonly dataSource: DataSource,
  ) {}

  async registerToken(userId: string, dto: RegisterDeviceTokenDto) {
    return this.dataSource.transaction(async (manager) => {
      const deviceTokenRepo = manager.getRepository(DeviceToken);

      const existing = await deviceTokenRepo.findOne({
        where: { token: dto.token },
      });

      if (existing) {
        if (existing.userId === userId) {
          const updated = deviceTokenRepo.merge(existing, {
            platform: dto.platform,
            provider: dto.provider || existing.provider,
            token: dto.token || existing.token,
            isActive: true,
            lastSeenAt: new Date(),
          });
          return deviceTokenRepo.save(updated);
        } else {
          await deviceTokenRepo.update(
            { id: existing.id },
            { isActive: false, invalidatedAt: new Date() },
          );
        }
      }

      const entity = deviceTokenRepo.create({
        ...dto,
        userId,
        isActive: true,
        lastSeenAt: new Date(),
      });

      return deviceTokenRepo.save(entity);
    });
  }

  async unregisterToken(id: string, userId: string) {
    const device = await this.deviceTokenRepository.findOne({
      where: { id, userId },
    });
    if (!device) throw new ResourceNotFoundException('Device token', 'Token');
    await this.deviceTokenRepository.softDelete(id);
  }

  async getActiveTokenByUserId(userId: string) {
    return this.deviceTokenRepository.findOne({
      where: { userId, isActive: true },
    });
  }

  async deactivateByToken(token: string) {
    await this.deviceTokenRepository
      .createQueryBuilder()
      .update(DeviceToken)
      .set({ isActive: false, invalidatedAt: new Date() })
      .where('token = :token', { token })
      .execute();
  }
}
