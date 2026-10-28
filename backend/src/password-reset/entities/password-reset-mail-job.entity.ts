import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

export type MailJobStatus =
  'pending' | 'processing' | 'sent' | 'skipped' | 'failed';

@Entity('password_reset_mail_jobs')
@Index('IDX_reset_mail_ready', ['status', 'availableAt'])
export class PasswordResetMailJob {
  @PrimaryColumn('varchar')
  id: string;

  @Column('text', { nullable: true })
  encryptedPayload: string | null;

  @Column('varchar')
  status: MailJobStatus;

  @Column('integer', { default: 0 })
  attempts: number;

  @Column('datetime')
  availableAt: Date;

  @Column('datetime', { nullable: true })
  leaseUntil: Date | null;

  @Column('varchar', { nullable: true })
  leaseId: string | null;

  @Column('varchar', { nullable: true })
  tokenId: string | null;

  @Column('datetime')
  createdAt: Date;

  @Column('datetime', { nullable: true })
  completedAt: Date | null;
}
