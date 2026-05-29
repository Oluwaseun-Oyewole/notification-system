import { BaseEntity } from 'src/shared/entity/BaseEntity';
import {
  DevicePlatform,
  NotificationChannel,
} from 'src/shared/enums/index.enums';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'device_tokens' })
export class DeviceToken extends BaseEntity {
  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: DevicePlatform })
  platform: DevicePlatform;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    default: NotificationChannel.FCM,
  })
  provider: NotificationChannel;

  @Index({ unique: true })
  @Column()
  token: string;

  @Index()
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ nullable: true, name: 'device_id' })
  deviceId?: string;

  @Column({ nullable: true, name: 'last_seen_at', type: 'timestamptz' })
  lastSeenAt?: Date;

  @Column({ nullable: true, name: 'invalidated_at', type: 'timestamptz' })
  invalidatedAt?: Date;
}
