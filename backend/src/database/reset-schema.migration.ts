import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { PasswordResetToken } from '../password-reset/entities/password-reset-token.entity';
import { PasswordResetMailJob } from '../password-reset/entities/password-reset-mail-job.entity';

export class ResetSchema1793145600000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    for (const entity of [User, PasswordResetToken, PasswordResetMailJob]) {
      const metadata = runner.connection.getMetadata(entity);
      if (!(await runner.hasTable(metadata.tableName))) {
        await runner.createTable(
          Table.create(metadata, runner.connection.driver),
        );
      } else if (entity === User) {
        const existing = await runner.getTable(metadata.tableName);
        if (
          metadata.columns.some(
            (column) => !existing?.findColumnByName(column.databaseName),
          )
        ) {
          throw new Error(
            'Existing users schema is incompatible; no user columns were changed',
          );
        }
      }
    }
    const table = await runner.getTable('password_reset_tokens');
    if (!table?.foreignKeys.some((key) => key.columnNames.includes('userId'))) {
      await runner.createForeignKey(
        'password_reset_tokens',
        new TableForeignKey({
          columnNames: ['userId'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
    }
  }

  down(): Promise<void> {
    return Promise.reject(
      new Error(
        'Automatic rollback is disabled; preserve existing users and reset history.',
      ),
    );
  }
}
