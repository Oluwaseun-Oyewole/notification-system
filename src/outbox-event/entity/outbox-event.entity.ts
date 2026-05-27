import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum OutboxEventStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  FAILED = 'failed',
}

export enum EventType {
  SEND_NOTIFICATION = 'send_notification',
  USER_REGISTRATION = 'user_registration',
}

@Entity({ name: 'outbox_events' })
export class OutboxEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'notification_id' })
  notificationId: string;

  @Column({
    type: 'enum',
    enum: OutboxEventStatus,
    default: OutboxEventStatus.PENDING,
  })
  status: OutboxEventStatus;

  @Column({
    type: 'enum',
    enum: EventType,
  })
  eventType: EventType;

  // Snapshot of what to enqueue — decoupled from the notification row
  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ nullable: true, name: 'processed_at', type: 'timestamptz' })
  processedAt: Date;

  @Column({ nullable: true })
  error: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
