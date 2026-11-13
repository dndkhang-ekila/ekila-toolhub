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
      expect(profile.theme).toBe('system');
      expect(profile.locale).toBe('vi');
      expect(profile.isDeleted).toBe(false);
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

  describe('getPreferences', () => {
    it('should return user theme and locale preferences', async () => {
      const prefs = await service.getPreferences('usr_demo_123');
      expect(prefs).toBeDefined();
      expect(prefs.theme).toBe('system');
      expect(prefs.locale).toBe('vi');
    });

    it('should throw NotFoundException if user not found', async () => {
      await expect(service.getPreferences('unknown_user')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updatePreferences', () => {
    it('should update theme to dark and locale to en successfully', async () => {
      const updated = await service.updatePreferences('usr_demo_123', {
        theme: 'dark',
        locale: 'en',
      });
      expect(updated.theme).toBe('dark');
      expect(updated.locale).toBe('en');

      const current = await service.getPreferences('usr_demo_123');
      expect(current.theme).toBe('dark');
      expect(current.locale).toBe('en');
    });

    it('should throw NotFoundException when updating non-existent user', async () => {
      await expect(
        service.updatePreferences('unknown_user', { theme: 'light' }),
      ).rejects.toThrow(NotFoundException);
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

  describe('requestDeleteAccount [FR-ACC-05]', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      await expect(
        service.requestDeleteAccount('unknown_usr', {
          password: 'Password123@',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if password is wrong', async () => {
      await expect(
        service.requestDeleteAccount('usr_demo_123', {
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully schedule account deletion for 30 days and invalidate sessions', async () => {
      const res = await service.requestDeleteAccount('usr_demo_123', {
        password: 'Password123@',
      });

      expect(res.success).toBe(true);
      expect(res.gracePeriodDays).toBe(30);
      expect(res.scheduledPermanentDeletionAt).toBeInstanceOf(Date);

      // Kiểm tra trạng thái đã chuyển sang isDeleted = true
      const profile = await service.getProfile('usr_demo_123');
      expect(profile.isDeleted).toBe(true);
      expect(profile.deletedAt).toBeInstanceOf(Date);
      expect(profile.scheduledPermanentDeletionAt).toBeInstanceOf(Date);
    });

    it('should throw BadRequestException if account is already marked for deletion', async () => {
      await service.requestDeleteAccount('usr_demo_123', {
        password: 'Password123@',
      });

      await expect(
        service.requestDeleteAccount('usr_demo_123', {
          password: 'Password123@',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('restoreAccount [FR-ACC-05]', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      await expect(service.restoreAccount('unknown_usr')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if account is not marked for deletion', async () => {
      await expect(service.restoreAccount('usr_demo_123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should successfully restore account and cancel pending deletion', async () => {
      // Đầu tiên kích hoạt xoá
      await service.requestDeleteAccount('usr_demo_123', {
        password: 'Password123@',
      });

      // Sau đó khôi phục
      const res = await service.restoreAccount('usr_demo_123');
      expect(res.success).toBe(true);

      const profile = await service.getProfile('usr_demo_123');
      expect(profile.isDeleted).toBe(false);
      expect(profile.deletedAt).toBeNull();
      expect(profile.scheduledPermanentDeletionAt).toBeNull();
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
