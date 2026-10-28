import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { PasswordResetError } from './password-reset.errors';

@Catch()
export class PasswordResetErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(PasswordResetErrorFilter.name);

  catch(error: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Access-Control-Expose-Headers', 'Retry-After');
    if (error instanceof PasswordResetError) {
      if (error.retryAfter)
        response.setHeader('Retry-After', String(error.retryAfter));
      response.status(error.getStatus()).json({ error: { code: error.code } });
      return;
    }
    if (error instanceof HttpException && error.getStatus() === 400) {
      response.status(400).json({ error: { code: 'INVALID_REQUEST' } });
      return;
    }
    this.logger.error(
      'Password reset request failed; sensitive error details suppressed',
    );
    response.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE' } });
  }
}
