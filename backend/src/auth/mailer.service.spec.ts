/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailerService } from './mailer.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('MailerService', () => {
  let service: MailerService;
  let mockConfigService: any;
  let mockSendMail: jest.Mock;

  beforeEach(async () => {
    mockSendMail = jest
      .fn()
      .mockResolvedValue({ messageId: 'test-msg-id-123' });
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    });
    (nodemailer.createTestAccount as jest.Mock).mockResolvedValue({
      user: 'ethereal_user',
      pass: 'ethereal_pass',
    });
    (nodemailer.getTestMessageUrl as jest.Mock).mockReturnValue(
      'https://ethereal.email/message/test',
    );

    mockConfigService = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'FRONTEND_URL':
            return 'http://localhost:3000';
          case 'SMTP_HOST':
            return 'smtp.gmail.com';
          case 'SMTP_PORT':
            return 587;
          case 'SMTP_USER':
            return 'test@gmail.com';
          case 'SMTP_PASS':
            return 'app-password-16';
          case 'MAIL_FROM':
            return '"ToolHub" <test@gmail.com>';
          default:
            return undefined;
        }
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailerService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MailerService>(MailerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('gửi email thành công qua SMTP khi có credentials', async () => {
    const result = await service.sendVerificationEmail(
      'recipient@example.com',
      '123456',
      'token-abc',
    );

    expect(result).toBe(true);
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
          user: 'test@gmail.com',
          pass: 'app-password-16',
        },
      }),
    );
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'recipient@example.com',
        subject: '[ToolHub] Mã xác minh tài khoản của bạn (OTP)',
      }),
    );
  });

  it('xử lý lỗi SMTP gracefully mà không gây crash hệ thống', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('Connection refused'));

    const result = await service.sendVerificationEmail(
      'recipient@example.com',
      '123456',
      'token-abc',
    );

    expect(result).toBe(false);
  });

  it('hoạt động chế độ fallback/Ethereal khi chưa cấu hình credentials', async () => {
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'SMTP_USER' || key === 'SMTP_PASS') return undefined;
      return 'http://localhost:3000';
    });

    const result = await service.sendVerificationEmail(
      'recipient@example.com',
      '654321',
      'token-xyz',
    );

    expect(result).toBe(true);
  });
});
