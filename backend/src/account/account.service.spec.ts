import { describe, it, expect, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountRepository } from './account.repository';

describe('AccountService', () => {
  let service: AccountService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccountService, AccountRepository],
    }).compile();

    service = module.get<AccountService>(AccountService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return profile for existing user', async () => {
      const profile = await service.getProfile('usr_demo_123');
      expect(profile).toBeDefined();
      expect(profile.id).toBe('usr_demo_123');
      expect(profile.email).toBe('user@ekila.vn');
    });

    it('should throw NotFoundException for non-existent user', async () => {
      await expect(service.getProfile('invalid_id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update name and phone successfully', async () => {
      const updated = await service.updateProfile('usr_demo_123', {
        name: 'Nguyen Van B',
        phone: '0987654321',
      });
      expect(updated.name).toBe('Nguyen Van B');
      expect(updated.phone).toBe('0987654321');
    });
  });

  describe('changePassword', () => {
    it('should throw BadRequestException if current password is wrong', async () => {
      await expect(
        service.changePassword('usr_demo_123', {
          currentPassword: 'WrongPassword!',
          newPassword: 'NewPassword123@',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if new password is identical to current password', async () => {
      await expect(
        service.changePassword('usr_demo_123', {
          currentPassword: 'Password123@',
          newPassword: 'Password123@',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should change password successfully with valid inputs', async () => {
      const result = await service.changePassword('usr_demo_123', {
        currentPassword: 'Password123@',
        newPassword: 'BrandNewPassword123@',
      });
      expect(result.success).toBe(true);

      const verifyNewPass = await service.changePassword('usr_demo_123', {
        currentPassword: 'BrandNewPassword123@',
        newPassword: 'Password123@',
      });
      expect(verifyNewPass.success).toBe(true);
    });
  });

  describe('logoutAllDevices', () => {
    it('should increment tokenVersion', async () => {
      const res = await service.logoutAllDevices('usr_demo_123');
      expect(res.success).toBe(true);
      expect(res.tokenVersion).toBeGreaterThan(1);
    });
  });
});
