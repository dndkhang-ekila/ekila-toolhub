import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { DataSourceOptions } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { PasswordResetToken } from '../password-reset/entities/password-reset-token.entity';
import { PasswordResetMailJob } from '../password-reset/entities/password-reset-mail-job.entity';
import { ResetSchema1793145600000 } from './reset-schema.migration';

export function databaseOptions(
  database = process.env.DATABASE_PATH ||
    resolve(process.cwd(), 'data/toolhub.sqlite'),
): DataSourceOptions {
  if (database !== ':memory:')
    mkdirSync(dirname(resolve(database)), { recursive: true });
  return {
    type: 'better-sqlite3',
    database,
    entities: [User, PasswordResetToken, PasswordResetMailJob],
    migrations: [ResetSchema1793145600000],
    migrationsRun: false,
    synchronize: false,
    logging: false,
    enableWAL: database !== ':memory:',
    timeout: 100,
  };
}
