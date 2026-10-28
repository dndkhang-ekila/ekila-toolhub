import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('password_reset_tokens')
@Index('IDX_reset_user', ['userId'])
@Index('IDX_reset_expiry', ['expiresAt'])
export class PasswordResetToken {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar')
  userId: string;

  @Index('IDX_reset_token_hash', { unique: true })
  @Column('varchar', { length: 64 })
  tokenHash: string;

  @Column('datetime')
  expiresAt: Date;

  @Column('datetime', { nullable: true })
  usedAt: Date | null;

  @Column('datetime', { nullable: true })
  revokedAt: Date | null;

  @Column('datetime')
  createdAt: Date;
}
