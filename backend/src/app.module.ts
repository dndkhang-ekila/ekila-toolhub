import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import { User } from './auth/entities/user.entity';
import { AuthModule } from './auth/auth.module';
import { AccountModule } from './account/account.module';
import { TwoFactorAuthModule } from './two-factor-auth/two-factor-auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => ({
        type: 'better-sqlite3',
        database: config.get<string>(
          'DATABASE_PATH',
          join(__dirname, '..', 'data', 'toolhub.sqlite'),
        ),
        entities: [User],
        // TODO: In production, switch database driver to PostgreSQL/MySQL and use migrations instead of synchronize: true
        synchronize: true, // Tự động tạo và cập nhật bảng users trong Database SQLite thật
      }),
    }),
    AuthModule,
    AccountModule,
    TwoFactorAuthModule,
  ],
})
export class AppModule {}
