import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const elapsed = Date.now() - startTime;
          const statusCode = response.statusCode;
          this.logger.log(`${method} ${url} ${statusCode} - ${elapsed}ms`);
        },
        error: (error: unknown) => {
          const elapsed = Date.now() - startTime;
          const status =
            error instanceof Error && 'status' in error
              ? (error as { status: number }).status
              : 500;
          this.logger.warn(
            `${method} ${url} ${status} - ${elapsed}ms | Error: ${error instanceof Error ? error.message : String(error)}`,
          );
        },
      }),
    );
  }
}
