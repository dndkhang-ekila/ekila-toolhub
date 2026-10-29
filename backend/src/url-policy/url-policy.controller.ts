import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { UrlPolicyError } from './url-policy.error';
import { UrlPolicyRateLimiter } from './url-policy.rate-limiter';
import { UrlPolicyService } from './url-policy.service';

@Controller('url-policy')
export class UrlPolicyController {
  constructor(
    private readonly policy: UrlPolicyService,
    private readonly limiter: UrlPolicyRateLimiter,
  ) {}

  @Post('check')
  @HttpCode(200)
  async check(
    @Body() body: unknown,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Access-Control-Expose-Headers', 'Retry-After');
    const cancellation = new AbortController();
    const disconnect = () => {
      if (!response.writableFinished) cancellation.abort();
    };
    response.once('close', disconnect);
    try {
      this.limiter.check(request.ip ?? 'unknown');
      if (
        !body ||
        typeof body !== 'object' ||
        Array.isArray(body) ||
        Object.keys(body).length !== 1 ||
        !('url' in body)
      )
        throw new UrlPolicyError('INVALID_URL');
      return await this.policy.assertCanShorten(body.url, cancellation.signal);
    } catch (error) {
      if (error instanceof UrlPolicyError && error.getStatus() === 429)
        response.setHeader('Retry-After', '60');
      throw error;
    } finally {
      response.removeListener('close', disconnect);
    }
  }
}
