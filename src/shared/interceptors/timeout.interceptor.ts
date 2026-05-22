import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  catchError,
  Observable,
  throwError,
  timeout,
  TimeoutError,
} from 'rxjs';
import { DEFAULT_TIMEOUT_MS } from '../config/index.config';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const timeoutMs =
      this.reflector.get<number>('request_timeout', context.getHandler()) ??
      DEFAULT_TIMEOUT_MS;

    if (timeoutMs <= 0 || Number.isNaN(timeoutMs) || !timeoutMs) {
      return next.handle();
    }

    return next.handle().pipe(
      timeout(timeoutMs),
      catchError((err) => {
        if (err.name === 'TimeoutError' || err instanceof TimeoutError) {
          throw new RequestTimeoutException(
            `Request timed out after ${timeoutMs}ms`,
          );
        }
        return throwError(() => err);
      }),
    );
  }
}
