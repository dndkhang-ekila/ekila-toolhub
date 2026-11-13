import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccountRepository } from './account.repository';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  DeleteAccountResponse,
  UserAccount,
  UserPreferences,
  UserProfile,
} from './account.types';
import { PasswordHasher } from './password-hasher';

@Injectable()
export class AccountService {
  constructor(private readonly accountRepository: AccountRepository) {}

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.accountRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return this.toUserProfile(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserProfile> {
    const updated = await this.accountRepository.updateProfile(userId, dto);
    if (!updated) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return this.toUserProfile(updated);
  }

  async getPreferences(userId: string): Promise<UserPreferences> {
    const user = await this.accountRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return {
      theme: user.theme || 'system',
      locale: user.locale || 'vi',
    };
  }

  async updatePreferences(
    userId: string,
    dto: UpdatePreferencesDto,
  ): Promise<UserPreferences> {
    const updated = await this.accountRepository.updatePreferences(userId, dto);
    if (!updated) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return {
      theme: updated.theme || 'system',
      locale: updated.locale || 'vi',
    };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.accountRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const isCurrentPasswordValid = PasswordHasher.verify(
      dto.currentPassword,
      user.passwordHash,
      user.passwordSalt,
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
    }

    const isSamePassword = PasswordHasher.verify(
      dto.newPassword,
      user.passwordHash,
      user.passwordSalt,
    );
    if (isSamePassword) {
      throw new BadRequestException(
        'Mật khẩu mới không được trùng với mật khẩu cũ',
      );
    }

    const { hash, salt } = PasswordHasher.hash(dto.newPassword);
    await this.accountRepository.updatePassword(userId, hash, salt);

    return {
      success: true,
      message:
        'Đổi mật khẩu thành công. Các phiên đăng nhập khác đã được đăng xuất.',
    };
  }

  /**
   * [FR-ACC-05] Xoá tài khoản và toàn bộ dữ liệu liên quan trong vòng 30 ngày
   * Yêu cầu xác thực mật khẩu, kích hoạt thời hạn ân hạn 30 ngày và vô hiệu hoá token phiên
   */
  async requestDeleteAccount(
    userId: string,
    dto: DeleteAccountDto,
  ): Promise<DeleteAccountResponse> {
    const user = await this.accountRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (user.isDeleted) {
      throw new BadRequestException(
        'Tài khoản này đã được yêu cầu xoá và đang trong thời hạn chờ huỷ 30 ngày',
      );
    }

    const isPasswordValid = PasswordHasher.verify(
      dto.password,
      user.passwordHash,
      user.passwordSalt,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Mật khẩu xác nhận không chính xác');
    }

    const gracePeriodDays = 30;
    const scheduledDate = new Date(
      Date.now() + gracePeriodDays * 24 * 60 * 60 * 1000,
    );

    const updated = await this.accountRepository.markAccountForDeletion(
      userId,
      scheduledDate,
    );
    if (!updated) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return {
      success: true,
      message:
        'Yêu cầu xoá tài khoản đã được tiếp nhận thành công. Tài khoản sẽ được lưu trữ trong thời hạn ân hạn 30 ngày trước khi bị xoá vĩnh viễn cùng toàn bộ dữ liệu liên quan. Mọi phiên đăng nhập hiện tại đã được vô hiệu hoá.',
      scheduledPermanentDeletionAt: scheduledDate,
      gracePeriodDays,
    };
  }

  /**
   * Khôi phục tài khoản trong thời hạn ân hạn 30 ngày
   */
  async restoreAccount(
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.accountRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (!user.isDeleted) {
      throw new BadRequestException(
        'Tài khoản đang hoạt động bình thường, không trong trạng thái chờ huỷ',
      );
    }

    await this.accountRepository.restoreAccount(userId);

    return {
      success: true,
      message:
        'Khôi phục tài khoản thành công. Trạng thái chờ xoá đã được huỷ bỏ.',
    };
  }

  async logoutAllDevices(
    userId: string,
  ): Promise<{ success: boolean; message: string; tokenVersion: number }> {
    const nextVersion =
      await this.accountRepository.incrementTokenVersion(userId);
    if (nextVersion === null) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return {
      success: true,
      message: 'Đã hủy tất cả các phiên đăng nhập trên mọi thiết bị.',
      tokenVersion: nextVersion,
    };
  }

  private toUserProfile(user: UserAccount): UserProfile {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      theme: user.theme || 'system',
      locale: user.locale || 'vi',
      isDeleted: !!user.isDeleted,
      deletedAt: user.deletedAt || null,
      scheduledPermanentDeletionAt: user.scheduledPermanentDeletionAt || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
