import { Injectable } from '@nestjs/common';
import { UserAccount } from './account.types';
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
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            phone: '0901234567',
            tokenVersion: 1,
            passwordHash: demoPassword.hash,
            passwordSalt: demoPassword.salt,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.users.set(demoUser.id, demoUser);
    }

    async findById(id: string): Promise<UserAccount | null> {
        const user = this.users.get(id);
        return user ? { ...user } : null;
    }

    async findByEmail(email: string): Promise<UserAccount | null> {
        for (const user of this.users.values()) {
            if (user.email === email) {
                return { ...user };
            }
        }
        return null;
    }

    async updateProfile(
        id: string,
        updates: { name?: string; avatarUrl?: string; phone?: string },
    ): Promise<UserAccount | null> {
        const user = this.users.get(id);
        if (!user) {
            return null;
        }
        const updatedUser: UserAccount = {
            ...user,
            ...updates,
            updatedAt: new Date(),
        };
        this.users.set(id, updatedUser);
        return { ...updatedUser };
    }

    async updatePassword(
        id: string,
        passwordHash: string,
        passwordSalt: string,
    ): Promise<UserAccount | null> {
        const user = this.users.get(id);
        if (!user) {
            return null;
        }
        const updatedUser: UserAccount = {
            ...user,
            passwordHash,
            passwordSalt,
            tokenVersion: user.tokenVersion + 1,
            updatedAt: new Date(),
        };
        this.users.set(id, updatedUser);
        return { ...updatedUser };
    }

    async incrementTokenVersion(id: string): Promise<number | null> {
        const user = this.users.get(id);
        if (!user) {
            return null;
        }
        user.tokenVersion += 1;
        user.updatedAt = new Date();
        this.users.set(id, user);
        return user.tokenVersion;
    }
}
