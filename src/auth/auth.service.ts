import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { Request } from 'express';
import {
  Notification,
  NotificationType,
} from 'src/notifications/entity/notification.entity';
import { OtpService } from 'src/otp/otp.service';
import {
  EventType,
  OutboxEvent,
} from 'src/outbox-event/entity/outbox-event.entity';
import { SessionsService } from 'src/sessions/sessions.service';
import {
  NotificationChannel,
  NotificationStatus,
} from 'src/shared/enums/index.enums';
import {
  BadRequestException,
  ForbiddenException,
  InvalidCredentialsException,
  ResourceNotFoundException,
} from 'src/shared/exceptions/domain.exceptions';
import { TokenService } from 'src/token/token.service';
import {
  CreateUserDto,
  LoginDto,
  ResendVerificationEmailDto,
  VerifyOtpDto,
} from 'src/users/dto/user.dto';
import { UsersService } from 'src/users/users.service';
import { DataSource } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
    private readonly sessionsService: SessionsService,
    private readonly tokenService: TokenService,
    private readonly dataSource: DataSource,
  ) {}

  async register(data: CreateUserDto) {
    const { otp, verifyToken } = await this.otpService.generateRegistrationOtp(
      data.email,
    );
    const result = await this.dataSource.transaction(async (manager) => {
      const user = await this.userService.createUser(data, manager);
      const verificationLink = `${this.configService.get('APP_URL')}/verify/?otp=${otp}&token=${verifyToken}`;

      const notification = manager.create(Notification, {
        userId: user.id,
        type: NotificationType.USER_REGISTRATION,
        channel: NotificationChannel.EMAIL,
        status: NotificationStatus.PENDING,

        payload: {
          to: data.email,
          subject: 'Verify your account',
          template: 'generic',
          context: {
            subject: 'Verify your account',
            message: `Use OTP ${otp} to verify your account or click the button below.`,
            actionUrl: verificationLink,
            actionLabel: 'Verify account',
          },
        },
      });
      await manager.save(notification);

      await manager.save(OutboxEvent, {
        notificationId: notification.id,
        eventType: EventType.USER_REGISTRATION,
        payload: {
          notificationId: notification.id,
          channel: NotificationChannel.EMAIL,
          payload: notification.payload,
        },
      });
      return { token: verifyToken, email: data.email };
    });
    console.log({ result });
    return result;
  }

  async login(data: LoginDto, request: Request) {
    const user = await this.userService.findUserWithPassword(data.email);
    if (!user) throw new InvalidCredentialsException();

    if (!user.activatedAt) {
      throw new ForbiddenException(
        'Your account is not activated. Please check your email for the activation details',
        'ACTIVATION_REQUIRED',
      );
    }

    const isPasswordValid = await argon2.verify(user.password, data.password);
    if (!isPasswordValid) throw new InvalidCredentialsException();

    await this.userService.updateLoginTimestamp(user.id);
    user.password = undefined;

    const session = await this.sessionsService.createSession(user.id, {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });

    const { accessToken, refreshToken } =
      await this.tokenService.issueTokenPair(user.id, session.sessionId);

    return { accessToken, refreshToken, user };
  }

  async verify(input: VerifyOtpDto) {
    await this.otpService.verifyRegistrationOtp(input.email, input.otp);

    const user = await this.userService.findUserByEmail(input.email);

    if (!user) throw new ResourceNotFoundException('User', input.email);

    if (user.activatedAt)
      throw new ForbiddenException('User already activated');

    await this.userService.activateUser({ email: input.email });
  }

  async resendOtp(input: ResendVerificationEmailDto) {
    const user = await this.userService.findUserByEmail(input.email);
    if (!user) throw new ResourceNotFoundException('User', input.email);

    if (user.activatedAt)
      throw new ForbiddenException('User is already activated');

    const { otp, verifyToken } = await this.otpService.generateRegistrationOtp(
      input.email,
    );
    const verificationLink = `${this.configService.get<string>('APP_URL')}/verify/?otp=${otp}&token=${verifyToken}`;

    await this.dataSource.transaction(async (manager) => {
      const notification = manager.create(Notification, {
        userId: user.id,
        type: NotificationType.USER_REGISTRATION,
        channel: NotificationChannel.EMAIL,
        status: NotificationStatus.PENDING,
        payload: {
          to: input.email,
          subject: 'Verify your account',
          template: 'generic',
          context: {
            subject: 'Verify your account',
            message: `Use OTP ${otp} to verify your account or click the button below.`,
            actionUrl: verificationLink,
            actionLabel: 'Verify account',
          },
        },
      });

      await manager.save(notification);

      await manager.save(OutboxEvent, {
        notificationId: notification.id,
        eventType: EventType.USER_REGISTRATION,
        payload: {
          notificationId: notification.id,
          channel: NotificationChannel.EMAIL,
          payload: notification.payload,
        },
      });
    });

    return { token: verifyToken, email: input.email };
  }

  async logout(userId: string, sessionId: string, family: string) {
    const currentDeviceSession =
      await this.sessionsService.getSession(sessionId);
    if (!currentDeviceSession) throw new ForbiddenException('Invalid session');
    await this.sessionsService.revoke(sessionId, userId);
    await this.tokenService.revokeTokenFamily(userId, family);
  }

  async refreshTokens(refreshToken: string, family: string) {
    let decoded: { sub: string; jti: string; sessionId: string };

    try {
      decoded = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET_KEY'),
      });
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        const decoded = this.jwtService.decode(refreshToken) as {
          sub: string;
          jti: string;
          sessionId: string;
        };
        if (!decoded?.jti) throw new BadRequestException('Malformed token');
        await this.sessionsService.revoke(decoded.sessionId, decoded.sub);
        throw new ForbiddenException('Refresh token has expired');
      }
      throw new ForbiddenException('Invalid refresh token');
    }

    const verifyRecord = await this.tokenService.verifyRefreshToken(
      decoded.sub,
      refreshToken,
      family,
    );

    if (!verifyRecord) {
      await this.sessionsService.revoke(decoded.sessionId, decoded.sub);
      throw new ForbiddenException('Refresh token revoked');
    }

    const currentSession = await this.sessionsService.getSession(
      decoded.sessionId,
    );

    if (!currentSession) throw new ForbiddenException('Session not found');

    const accessAndRefreshTokens = await this.tokenService.issueTokenPair(
      decoded.sub,
      decoded.sessionId,
    );

    await this.sessionsService.createSession(decoded.sub, {
      ip: currentSession.ip,
      userAgent: currentSession.userAgent,
    });

    await this.tokenService.revokeFamilyAndSession(
      decoded.sub,
      decoded.sessionId,
      family,
    );

    return {
      ...accessAndRefreshTokens,
    };
  }
}
