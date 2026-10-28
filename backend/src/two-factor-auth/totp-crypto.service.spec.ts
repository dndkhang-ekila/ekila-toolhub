import { Test, TestingModule } from '@nestjs/testing';
import { TotpCryptoService } from './totp-crypto.service';

describe('TotpCryptoService', () => {
  let service: TotpCryptoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TotpCryptoService],
    }).compile();

    service = module.get<TotpCryptoService>(TotpCryptoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should encode and decode base32 correctly', () => {
    const buffer = Buffer.from('ToolHub2026', 'utf-8');
    const encoded = service.encodeBase32(buffer);
    const decoded = service.decodeBase32(encoded);
    expect(decoded.toString('utf-8')).toEqual('ToolHub2026');
  });

  it('should generate valid 6-digit TOTP token', () => {
    const secret = service.generateSecret(20);
    const counter = Math.floor(Date.now() / 1000 / 30);
    const token = service.generateOtp(secret, counter);

    expect(token).toMatch(/^\d{6}$/);
  });

  it('should verify generated TOTP successfully', () => {
    const secret = service.generateSecret(20);
    const counter = Math.floor(Date.now() / 1000 / 30);
    const token = service.generateOtp(secret, counter);

    const isValid = service.verifyTotp(token, secret, 1);
    expect(isValid).toBe(true);
  });

  it('should reject invalid or malformed tokens', () => {
    const secret = service.generateSecret(20);
    expect(service.verifyTotp('12345', secret)).toBe(false);
    expect(service.verifyTotp('abcdef', secret)).toBe(false);
    expect(service.verifyTotp('000000', secret)).toBe(false);
  });

  it('should generate backup codes and hash correctly', () => {
    const { plainCodes, hashedCodes } = service.generateBackupCodes(8);

    expect(plainCodes).toHaveLength(8);
    expect(hashedCodes).toHaveLength(8);

    plainCodes.forEach((code, idx) => {
      expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      expect(service.hashBackupCode(code)).toBe(hashedCodes[idx]);
    });
  });

  it('should create valid key URI', () => {
    const uri = service.generateKeyUri(
      'user@ekila.vn',
      'ToolHub',
      'JBSWY3DPEHPK3PXP',
    );
    expect(uri).toContain('otpauth://totp/ToolHub:user%40ekila.vn');
    expect(uri).toContain('secret=JBSWY3DPEHPK3PXP');
  });
});
