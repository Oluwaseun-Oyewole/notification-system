import { IsEnum, IsNotEmpty, IsObject, IsOptional } from 'class-validator';
import { OutboxEventStatus } from '../entity/outbox-event.entity';

export class OutboxEventDto {
  @IsEnum(OutboxEventStatus)
  @IsNotEmpty()
  status: OutboxEventStatus;

  @IsOptional()
  @IsObject()
  payload: Record<string, any>;
}
