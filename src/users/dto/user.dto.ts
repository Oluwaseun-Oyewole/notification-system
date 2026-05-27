import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  MinLength,
} from 'class-validator';
import { User } from '../entity/user.entity';

export class CreateUserDto {
  @ApiProperty({
    description: 'Unique email address',
    example: 'jane@company.com',
    format: 'email',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description:
      'Account password in plain text; hashed with argon2 before storage.',
    example: 'S3cureP@ssw0rd',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class LoginDto {
  @ApiProperty({
    description: 'Registered email for authentication.',
    example: 'jane@company.com',
    format: 'email',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @ApiProperty({
    description:
      'Raw password to validate against stored hash; hashed with argon2 before storage.',
    example: 'S3cureP@ssw0rd',
    minLength: 8,
  })
  password: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Verification token issued by email link flow.',
    example: 'a8fba75bb8ef4f419ec6c102f40228b8',
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'One-time passcode issued for verification flow.',
    example: '482931',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6)
  otp: string;

  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    description: 'Email address of the unverified account.',
    example: 'jane@company.com',
    format: 'email',
  })
  email: string;
}

export class ResendVerificationEmailDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    description: 'Email address of the unverified account.',
    example: 'jane@company.com',
    format: 'email',
  })
  email: string;
}

export class UserResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the user.',
    example: '8b48c89e-a58f-4ad5-b0be-d87f8f40c7e4',
  })
  id: string;

  @ApiProperty({
    description: 'Full name of the user.',
    example: 'Jane Doe',
  })
  fullname: string;

  @ApiProperty({
    description: 'Registered email address.',
    example: 'jane@company.com',
  })
  email: string;

  @ApiProperty({
    description:
      'Indicates whether the user has activated their account via email verification.',
    example: true,
  })
  activatedAt: Date;

  @ApiProperty({
    description:
      'Timestamp of the last password change; used to invalidate sessions after password updates.',
    example: '2024-01-15T10:20:30Z',
  })
  passwordChangeAt: Date;

  @ApiProperty({
    description:
      'Timestamp of the last successful login; useful for security monitoring and session management.',
    example: '2024-01-20T14:45:00Z',
  })
  lastLoginAt: Date;

  @ApiProperty({
    description: 'Timestamp of when the user account was created.',
    example: '2024-01-01T12:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp of the last update to the user account.',
    example: '2024-01-10T15:30:00Z',
  })
  updatedAt: Date;

  constructor(user: User) {
    Object.assign(this, user);
  }
}
