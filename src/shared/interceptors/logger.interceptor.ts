import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const path = context.getArgs()[0]?.url;
    const method = context.getArgs()[0]?.method;
    const controller = context.getClass().name;
    const pattern = context.getHandler().name;
    const now = Date.now();
    return next.handle().pipe(
      tap(() =>
        console.info(
          `Success => [${method} -- ${path}] => [${controller} => ${pattern}] -- After... ${Date.now() - now}ms`,
        ),
      ),
      catchError((error) => {
        console.error(
          `Error => [${controller} => ${pattern}] , ${error.stack} ${error.message} -- After... ${Date.now() - now}ms`,
        );
        return throwError(() => error);
      }),
    );
  }
}
