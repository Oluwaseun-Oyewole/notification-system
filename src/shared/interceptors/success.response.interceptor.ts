import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { map, Observable } from 'rxjs';
import { SUCCESS_MESSAGE_KEY } from '../decorators/success.message.decorator';
import { ApiResponse } from '../interfaces/api.response';

@Injectable()
export class SuccessResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T> | void
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<void | ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const message =
      this.reflector.getAllAndOverride<string>(SUCCESS_MESSAGE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'Request successful';

    return next.handle().pipe(
      map((data) => {
        return {
          success: true,
          statusCode: response.statusCode,
          message,
          timestamp: new Date().toISOString(),
          path: request.url,
          data,
        };
      }),
    );
  }
}
