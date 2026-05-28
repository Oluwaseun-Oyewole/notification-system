import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from 'src/shared/decorators/pubic.decorator';
import { GetToken } from 'src/shared/decorators/token.decorator';
import { CurrentUser } from 'src/shared/decorators/user.decorator';
import { ResponseBuilder } from 'src/shared/utils/api-response.builder';
import {
  CreateUserDto,
  LoginDto,
  ResendVerificationEmailDto,
  VerifyOtpDto,
} from 'src/users/dto/user.dto';
import { AuthService } from './auth.service';
import { RegisterResponseDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JWTRefreshTokenGuard } from './guards/jwt-refresh.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() data: CreateUserDto) {
    const resp = await this.authService.register(data);
    return ResponseBuilder.created(
      new RegisterResponseDto(resp),
      'User registered successfully. Please check your email to verify your account.',
    );
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() data: LoginDto, @Req() req: Request) {
    const resp = await this.authService.login(data, req);
    return ResponseBuilder.success(resp, 'Login successful');
  }

  @Public()
  @Post('verify')
  async verify(@Body() data: VerifyOtpDto) {
    const resp = await this.authService.verify(data);
    return ResponseBuilder.created(resp, 'User verified successfully.');
  }

  @Public()
  @Post('resend-otp')
  async resendOtp(@Body() data: ResendVerificationEmailDto) {
    const user = await this.authService.resendOtp(data);
    return ResponseBuilder.created(
      new RegisterResponseDto(user),
      'Verification OTP resent successfully. Please check your email.',
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: { sub: string; sessionId: string; family: string },
  ) {
    await this.authService.logout(user.sub, user.sessionId, user.family);
    return ResponseBuilder.success(null, 'Logged out successfully.');
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JWTRefreshTokenGuard)
  async refreshTokens(
    @GetToken() refreshToken: string,
    @CurrentUser() user: { family: string },
  ) {
    const accessAndRefreshTokens = await this.authService.refreshTokens(
      refreshToken,
      user.family,
    );
    return ResponseBuilder.success(
      accessAndRefreshTokens,
      'Tokens refreshed successfully.',
    );
  }
}
