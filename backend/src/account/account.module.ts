import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AccountController } from './account.controller';
import { AccountRepository } from './account.repository';
import { AccountService } from './account.service';
import { EventsGateway } from './events.gateway';

@Module({
  imports: [AuthModule],
  controllers: [AccountController],
  providers: [AccountService, AccountRepository, EventsGateway],
  exports: [AccountService, AccountRepository, EventsGateway],
})
export class AccountModule {}
