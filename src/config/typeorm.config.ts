import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

const isProduction = process.env.NODE_ENV === 'production';

config();
const configService = new ConfigService();

export const typeormConfigOptions: DataSourceOptions = {
  type: 'postgres',
  host: configService.get<string>('DB_HOST'),
  port: Number.parseInt(configService.get<string>('DB_PORT'), 10),
  username: configService.get<string>('DB_USER'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_NAME'),
  synchronize: false,

  entities: [`${__dirname}/../**/*.entity{.ts,.js}`],
  migrations: [`${__dirname}/../migrations/migrations/*{.ts,.js}`],
  migrationsRun: isProduction,

  extra: {
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    max: isProduction ? 20 : 5,
    min: isProduction ? 5 : 1,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  },
};

const dataSource = new DataSource(typeormConfigOptions);

export default dataSource;
