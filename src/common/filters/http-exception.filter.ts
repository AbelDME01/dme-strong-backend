import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { isUpstreamNetworkError } from '../utils/supabase-error.util';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp.message as string | string[]) ?? message;
        error = (resp.error as string) ?? exception.name;
      }
    } else if (exception instanceof Error) {
      // Connectivity/infrastructure failures must not be reported as client
      // errors nor leak internal details — surface them as 503.
      if (isUpstreamNetworkError(exception)) {
        statusCode = HttpStatus.SERVICE_UNAVAILABLE;
        message =
          'Upstream service is temporarily unavailable. Please try again later.';
        error = 'Service Unavailable';
      }
      // For any other unhandled error keep a generic message (no internal leak).
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
    }

    response.status(statusCode).json({
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
