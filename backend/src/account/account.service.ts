import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { AccountRepository } from './account.repository';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserAccount, UserProfile } from './account.types';
import { PasswordHasher } from './password-hasher';

@Injectable()
export class AccountService {
    constructor(private readonly accountRepository: AccountRepository) { }

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
            message: 'Đổi mật khẩu thành công. Các phiên đăng nhập khác đã được đăng xuất.',
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
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}
