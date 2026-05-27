import { Module } from '@nestjs/common';
import { RedisModule } from 'src/redis/redis.module';
import { SessionsService } from './sessions.service';

@Module({
  imports: [RedisModule],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
