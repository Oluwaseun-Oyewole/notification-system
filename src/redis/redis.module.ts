import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constant';
import { RedisService } from './redis.service';

@Module({
  imports: [],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => {
        const client = new Redis({
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
          password: configService.get<string>('redis.password'),
          db: configService.get<number>('redis.db'),
          retryStrategy(times) {
            if (times > 10) return null;
            return Math.min(times * 100, 3000);
          },
          lazyConnect: false,
          enableReadyCheck: true,
          maxRetriesPerRequest: 3,
        });

        client.on('connect', () => console.log('Redis: connected'));
        client.on('ready', () => console.log('Redis: ready'));
        client.on('error', (err) => console.error('Redis error:', err));
        client.on('close', () => console.warn('Redis: connection closed'));
        client.on('reconnecting', () => console.log('Redis: reconnecting...'));

        return client;
      },
    },
    RedisService,
  ],

  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
