import { Injectable } from '@nestjs/common';

@Injectable()
export class PasswordResetClock {
  now(): Date {
    return new Date();
  }
}
