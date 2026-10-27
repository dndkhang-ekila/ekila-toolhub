import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { TotpCryptoService } from './totp-crypto.service';
import { TwoFactorAuthRepository } from './two-factor-auth.repository';

describe('TwoFactorAuthService', () => {
  let service: TwoFactorAuthService;
  let cryptoService: TotpCryptoService;
  let repository: TwoFactorAuthRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwoFactorAuthService,
        TotpCryptoService,
        TwoFactorAuthRepository,
      ],
    }).compile();

    service = module.get<TwoFactorAuthService>(TwoFactorAuthService);
    cryptoService = module.get<TotpCryptoService>(TotpCryptoService);
    repository = module.get<TwoFactorAuthRepository>(TwoFactorAuthRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate 2FA credentials for user', async () => {
    const result = await service.generate({
      userId: 'user-1',
      accountName: 'test@toolhub.ekila.vn',
    });

    expect(result.secret).toBeDefined();
    expect(result.otpauthUri).toContain('ToolHub');
    expect(result.qrCodeUrl).toContain('data:image/png;base64');
    expect(result.backupCodes).toHaveLength(8);

    const record = await repository.findByUserId('user-1');
    expect(record).toBeDefined();
    expect(record?.isEnabled).toBe(false);
    expect(record?.tempSecret).toBe(result.secret);
  });

  it('should enable 2FA with valid token', async () => {
    const setup = await service.generate({ userId: 'user-2' });
    const counter = Math.floor(Date.now() / 1000 / 30);
    const validToken = cryptoService.generateOtp(setup.secret, counter);

    const response = await service.enable({
      userId: 'user-2',
      token: validToken,
    });

    expect(response.success).toBe(true);

    const status = await service.getStatus('user-2');
    expect(status.isEnabled).toBe(true);
    expect(status.remainingBackupCodes).toBe(8);
  });

  it('should reject enabling with invalid token', async () => {
    await service.generate({ userId: 'user-3' });

    await expect(
      service.enable({
        userId: 'user-3',
        token: '000000',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should verify 2FA token on login', async () => {
    const setup = await service.generate({ userId: 'user-4' });
    const counter = Math.floor(Date.now() / 1000 / 30);
    const validToken = cryptoService.generateOtp(setup.secret, counter);

    await service.enable({ userId: 'user-4', token: validToken });

    const verifyResult = await service.verify({
      userId: 'user-4',
      token: validToken,
    });

    expect(verifyResult.verified).toBe(true);
    expect(verifyResult.method).toBe('totp');
  });

  it('should verify and consume backup code', async () => {
    const setup = await service.generate({ userId: 'user-5' });
    const counter = Math.floor(Date.now() / 1000 / 30);
    const validToken = cryptoService.generateOtp(setup.secret, counter);

    await service.enable({ userId: 'user-5', token: validToken });

    const backupCode = setup.backupCodes[0];
    const backupResult = await service.verify({
      userId: 'user-5',
      token: backupCode,
    });

    expect(backupResult.verified).toBe(true);
    expect(backupResult.method).toBe('backup');
    expect(backupResult.remainingBackupCodes).toBe(7);

    await expect(
      service.verify({
        userId: 'user-5',
        token: backupCode,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should disable 2FA with valid token', async () => {
    const setup = await service.generate({ userId: 'user-6' });
    const counter = Math.floor(Date.now() / 1000 / 30);
    const validToken = cryptoService.generateOtp(setup.secret, counter);

    await service.enable({ userId: 'user-6', token: validToken });

    const disableResult = await service.disable({
      userId: 'user-6',
      token: validToken,
    });

    expect(disableResult.success).toBe(true);

    const status = await service.getStatus('user-6');
    expect(status.isEnabled).toBe(false);
  });

  it('should throw error when generating for already enabled user', async () => {
    const setup = await service.generate({ userId: 'user-7' });
    const counter = Math.floor(Date.now() / 1000 / 30);
    const validToken = cryptoService.generateOtp(setup.secret, counter);

    await service.enable({ userId: 'user-7', token: validToken });

    await expect(service.generate({ userId: 'user-7' })).rejects.toThrow(
      BadRequestException,
    );
  });
});
