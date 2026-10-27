import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccountModule } from './account/account.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AccountModule],
})
export class AppModule { }
