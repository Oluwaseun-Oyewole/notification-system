import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MailServiceModule } from 'src/integrations/mail/mail.module';
import { OtpModule } from 'src/otp/otp.module';
import { SessionsModule } from 'src/sessions/sessions.module';
import { TokenModule } from 'src/token/token.module';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JWTRefreshTokenGuard } from './guards/jwt-refresh.guard';
import { RefreshTokenStrategy } from './strategies/jwt-refresh.strategy';
import { AccessJwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    OtpModule,
    SessionsModule,
    TokenModule,
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET_KEY'),
        signOptions: { expiresIn: config.get<number>('JWT_ACCESS_EXPIRES') },
      }),
    }),
    MailServiceModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccessJwtStrategy,
    RefreshTokenStrategy,
    JwtAuthGuard,
    JWTRefreshTokenGuard,
  ],
})
export class AuthModule {}
