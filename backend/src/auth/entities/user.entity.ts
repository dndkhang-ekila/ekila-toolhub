import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type UserRole = 'guest' | 'free' | 'pro' | 'admin';
export type UserPlan = 'free' | 'pro';
export type UserLocale = 'vi' | 'en';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordHash: string | null;

  @Column({ type: 'varchar', length: 20, default: 'free' })
  role: UserRole;

  @Column({ type: 'varchar', length: 20, default: 'free' })
  plan: UserPlan;

  @Column({ type: 'varchar', length: 10, default: 'vi' })
  locale: UserLocale;

  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ type: 'varchar', length: 10, nullable: true })
  verificationCode: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  verificationToken: string | null;

  @Column({ type: 'datetime', nullable: true })
  verificationExpiresAt: Date | null;

  @Index({ unique: true, where: 'googleId IS NOT NULL' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  googleId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'int', default: 1 })
  tokenVersion: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
