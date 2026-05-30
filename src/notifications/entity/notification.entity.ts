import { BaseEntity } from 'src/shared/entity/BaseEntity';
import {
  NotificationChannel,
  NotificationStatus,
} from 'src/shared/enums/index.enums';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'notifications' })
export class Notification extends BaseEntity {
  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: NotificationChannel })
  channel: NotificationChannel;

  @Index()
  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ nullable: true })
  failureReason: string;

  @Column({ default: 0, name: 'retry_count' })
  retryCount: number;

  @Column({ nullable: true, name: 'correlation_id', unique: true })
  correlationId: string;

  @Column({ nullable: true, name: 'sent_at', type: 'timestamptz' })
  sentAt: Date;
}
