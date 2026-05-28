import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenPayload } from 'src/token/token.service';

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): TokenPayload => {
    const request = ctx.switchToHttp().getRequest<{ user?: TokenPayload }>();

    if (!request.user) {
      throw new UnauthorizedException('Authentication required.');
    }

    return request.user;
  },
);
