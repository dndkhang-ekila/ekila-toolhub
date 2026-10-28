import { Injectable } from '@nestjs/common';
import {
  LocalePreference,
  ThemePreference,
  UserAccount,
} from './account.types';
import { PasswordHasher } from './password-hasher';

@Injectable()
export class AccountRepository {
  private readonly users: Map<string, UserAccount> = new Map();

  constructor() {
    const demoPassword = PasswordHasher.hash('Password123@');
    const demoUser: UserAccount = {
      id: 'usr_demo_123',
      email: 'user@ekila.vn',
      name: 'Ekila User',
      avatarUrl:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      phone: '0901234567',
      theme: 'system',
      locale: 'vi',
      tokenVersion: 1,
      passwordHash: demoPassword.hash,
      passwordSalt: demoPassword.salt,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(demoUser.id, demoUser);
  }

  findById(id: string): Promise<UserAccount | null> {
    const user = this.users.get(id);
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
    updates: {
      name?: string;
      avatarUrl?: string;
      phone?: string;
      theme?: ThemePreference;
      locale?: LocalePreference;
    },
  ): Promise<UserAccount | null> {
    const user = this.users.get(id);
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

  updatePreferences(
    id: string,
    preferences: {
      theme?: ThemePreference;
      locale?: LocalePreference;
    },
  ): Promise<UserAccount | null> {
    const user = this.users.get(id);
    if (!user) {
      return Promise.resolve(null);
    }
    const updatedUser: UserAccount = {
      ...user,
      ...(preferences.theme !== undefined ? { theme: preferences.theme } : {}),
      ...(preferences.locale !== undefined
        ? { locale: preferences.locale }
        : {}),
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
    const user = this.users.get(id);
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
    const user = this.users.get(id);
    if (!user) {
      return Promise.resolve(null);
    }
    user.tokenVersion += 1;
    user.updatedAt = new Date();
    this.users.set(id, user);
    return Promise.resolve(user.tokenVersion);
  }
}
