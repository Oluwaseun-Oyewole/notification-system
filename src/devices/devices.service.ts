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
      const tokenRepo = manager.getRepository(DeviceToken);

      const existing = await tokenRepo.findOne({
        where: { token: dto.token },
      });

      if (existing) {
        if (existing.userId === userId) {
          const updated = tokenRepo.merge(existing, {
            platform: dto.platform,
            provider: dto.provider || existing.provider,
            deviceId: dto.deviceId || existing.deviceId,
            isActive: true,
            lastSeenAt: new Date(),
          });
          return tokenRepo.save(updated);
        } else {
          // Different user — deactivate old
          await tokenRepo.update(
            { id: existing.id },
            { isActive: false, invalidatedAt: new Date() },
          );
        }
      }

      const entity = tokenRepo.create({
        ...dto,
        userId,
        isActive: true,
        lastSeenAt: new Date(),
      });

      return tokenRepo.save(entity);
    });
  }

  async unregister(id: string, userId: string): Promise<void> {
    const device = await this.deviceTokenRepository.findOne({
      where: { id, userId },
    });
    if (!device) throw new ResourceNotFoundException('Device token', 'Token');
    await this.deviceTokenRepository.softDelete(id);
  }

  async getActiveTokensByUserId(userId: string) {
    return this.deviceTokenRepository.find({
      where: { userId, isActive: true },
      order: { updatedAt: 'DESC' },
    });
  }

  async deactivateByToken(token: string): Promise<void> {
    await this.deviceTokenRepository
      .createQueryBuilder()
      .update(DeviceToken)
      .set({ isActive: false, invalidatedAt: new Date() })
      .where('token = :token', { token })
      .execute();
  }
}
