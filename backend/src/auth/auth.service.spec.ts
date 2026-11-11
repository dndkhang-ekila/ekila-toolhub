/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MailerService } from './mailer.service';
import { User } from './entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepository: any;
  let mockJwtService: any;
  let mockMailerService: any;

  beforeEach(async () => {
    mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('test_jwt_access_token'),
      verifyAsync: jest.fn(),
    };

    mockMailerService = {
      sendVerificationEmail: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('thành công tạo user mới khi email chưa tồn tại', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockImplementation((dto: any) => ({
        ...dto,
        id: 'usr-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      mockUserRepository.save.mockImplementation((user: any) =>
        Promise.resolve(user),
      );

      const result = await service.register({
        email: 'test@example.com',
        password: 'Password123@',
      });

      expect(result.success).toBe(true);
      expect(result.requiresEmailVerification).toBe(true);
      expect(result.verificationEmail).toBe('test@example.com');
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockMailerService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('báo lỗi BadRequestException khi email đã tồn tại', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: 'usr-existing',
        email: 'test@example.com',
      });

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'Password123@',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('thành công khi email và mật khẩu chính xác và email đã xác minh', async () => {
      const passwordHash = await service.hashPassword('Password123@');
      const mockUser = {
        id: 'usr-123',
        email: 'test@example.com',
        passwordHash,
        role: 'free',
        plan: 'free',
        locale: 'vi',
        isEmailVerified: true,
        tokenVersion: 1,
        createdAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.login({
        email: 'test@example.com',
        password: 'Password123@',
      });

      expect(result.success).toBe(true);
      expect(result.tokens?.accessToken).toBe('test_jwt_access_token');
      expect(result.user?.email).toBe('test@example.com');
    });

    it('báo lỗi UnauthorizedException khi sai mật khẩu', async () => {
      const passwordHash = await service.hashPassword('Password123@');
      const mockUser = {
        id: 'usr-123',
        email: 'test@example.com',
        passwordHash,
        isEmailVerified: true,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'WrongPassword@',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('trả về requiresEmailVerification khi tài khoản chưa kích hoạt', async () => {
      const passwordHash = await service.hashPassword('Password123@');
      const mockUser = {
        id: 'usr-123',
        email: 'test@example.com',
        passwordHash,
        isEmailVerified: false,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.login({
        email: 'test@example.com',
        password: 'Password123@',
      });

      expect(result.success).toBe(false);
      expect(result.requiresEmailVerification).toBe(true);
    });
  });

  describe('verifyEmail', () => {
    it('thành công cập nhật isEmailVerified khi nhập đúng mã OTP', async () => {
      const mockUser = {
        id: 'usr-123',
        email: 'test@example.com',
        verificationCode: '123456',
        verificationExpiresAt: new Date(Date.now() + 100000),
        isEmailVerified: false,
        role: 'free',
        plan: 'free',
        locale: 'vi',
        createdAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockImplementation((user: any) =>
        Promise.resolve(user),
      );

      const result = await service.verifyEmail({
        email: 'test@example.com',
        code: '123456',
      });

      expect(result.success).toBe(true);
      expect(mockUser.isEmailVerified).toBe(true);
      expect(result.tokens?.accessToken).toBe('test_jwt_access_token');
    });

    it('báo lỗi BadRequestException khi mã xác minh không đúng', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.verifyEmail({
          email: 'test@example.com',
          code: '999999',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('googleAuth', () => {
    it('tạo mới user nếu chưa có trong DB và trả về JWT', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockImplementation((dto: any) => ({
        ...dto,
        id: 'usr-google-1',
        createdAt: new Date(),
      }));
      mockUserRepository.save.mockImplementation((user: any) =>
        Promise.resolve(user),
      );

      const result = await service.googleAuth({});

      expect(result.success).toBe(true);
      expect(result.tokens?.accessToken).toBe('test_jwt_access_token');
      expect(mockUserRepository.save).toHaveBeenCalled();
    });
  });
});
