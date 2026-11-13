import { HttpException } from '@nestjs/common';

export class PasswordResetError extends HttpException {
  constructor(
    public readonly code: string,
    status: number,
    public readonly retryAfter = 0,
  ) {
    super({ error: { code } }, status);
  }
}
