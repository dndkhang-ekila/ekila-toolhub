import { Injectable } from '@nestjs/common';
import { UserAccount } from './account.types';
import { PasswordHasher } from './password-hasher';

@Injectable()
export class AccountRepository {
  // TODO: Thay thế in-memory Map bằng Database Model (Prisma / TypeORM) khi tích hợp DB
  private readonly users: Map<string, UserAccount> = new Map();

  constructor() {
    const demoPassword = PasswordHasher.hash('Password123@');
    // TODO: Dữ liệu mẫu hardcode để test, cần xóa khi kết nối Database thật
    const demoUser: UserAccount = {
      id: 'usr_demo_123',
      email: 'user@ekila.vn',
      name: 'Ekila User',
      avatarUrl:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      phone: '0901234567',
      role: 'free',
      plan: 'free',
      isEmailVerified: true,
      tokenVersion: 1,
      passwordHash: demoPassword.hash,
      passwordSalt: demoPassword.salt,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(demoUser.id, demoUser);
  }

  findById(id: string): Promise<UserAccount | null> {
    let user = this.users.get(id);
    if (!user && id.startsWith('usr_')) {
      const demo = this.users.get('usr_demo_123');
      if (demo) {
        user = { ...demo, id };
        this.users.set(id, user);
      }
    }
    return Promise.resolve(user ? { ...user } : null);
  }

  findByEmail(email: string): Promise<UserAccount | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return Promise.resolve({ ...user });
      }
    }
    return Promise.resolve(null);
  }

  updateProfile(
    id: string,
    updates: { name?: string; avatarUrl?: string; phone?: string },
  ): Promise<UserAccount | null> {
    let user = this.users.get(id);
    if (!user && id.startsWith('usr_')) {
      const demo = this.users.get('usr_demo_123');
      if (demo) {
        user = { ...demo, id };
      }
    }
    if (!user) {
      return Promise.resolve(null);
    }
    const updatedUser: UserAccount = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return Promise.resolve({ ...updatedUser });
  }

  updatePassword(
    id: string,
    passwordHash: string,
    passwordSalt: string,
  ): Promise<UserAccount | null> {
    let user = this.users.get(id);
    if (!user && id.startsWith('usr_')) {
      const demo = this.users.get('usr_demo_123');
      if (demo) {
        user = { ...demo, id };
      }
    }
    if (!user) {
      return Promise.resolve(null);
    }
    const updatedUser: UserAccount = {
      ...user,
      passwordHash,
      passwordSalt,
      tokenVersion: user.tokenVersion + 1,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return Promise.resolve({ ...updatedUser });
  }

  incrementTokenVersion(id: string): Promise<number | null> {
    let user = this.users.get(id);
    if (!user && id.startsWith('usr_')) {
      const demo = this.users.get('usr_demo_123');
      if (demo) {
        user = { ...demo, id };
      }
    }
    if (!user) {
      return Promise.resolve(null);
    }
    user.tokenVersion += 1;
    user.updatedAt = new Date();
    this.users.set(id, user);
    return Promise.resolve(user.tokenVersion);
  }
}
