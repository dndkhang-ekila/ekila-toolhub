import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UrlSafetyService } from './url-safety.service';

describe('UrlSafetyService', () => {
  let service: UrlSafetyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrlSafetyService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(null),
          },
        },
      ],
    }).compile();

    service = module.get<UrlSafetyService>(UrlSafetyService);
  });

  it('should reject URLs in the internal blocklist', async () => {
    const blockedUrls = [
      'https://phishing-bank-login.com/login',
      'https://sub.phishing-bank-login.com/auth',
      'http://free-nitro-scam.xyz/gift',
      'https://darkweb-market.cc/item',
      'https://evil-payload.ru/script.js',
    ];

    for (const url of blockedUrls) {
      const result = await service.checkUrlSafety(url);
      expect(result.isSafe).toBe(false);
      if (!result.isSafe) {
        expect(result.violationKind).toBe('INTERNAL_BLOCKLIST');
        expect(result.reason).toContain('danh sách chặn bảo mật nội bộ');
      }
    }
  });

  it('should reject URLs identified as malware by the malicious URL check service', async () => {
    const malwareUrls = [
      'https://malware-test.com/sample',
      'http://virus-download.top/setup.exe',
      'https://trojan-dropper.cc/payload',
      'http://ransomware.biz/lock',
    ];

    for (const url of malwareUrls) {
      const result = await service.checkUrlSafety(url);
      expect(result.isSafe).toBe(false);
      if (!result.isSafe) {
        expect(result.violationKind).toBe('MALICIOUS_MALWARE');
        expect(result.reason).toMatch(/mã độc hại|Malware/);
      }
    }
  });

  it('should reject URLs identified as phishing by the malicious URL check service', async () => {
    const phishingUrls = [
      'https://phishing-bank.com/secure',
      'http://paypal-login-verify.info/signin',
    ];

    for (const url of phishingUrls) {
      const result = await service.checkUrlSafety(url);
      expect(result.isSafe).toBe(false);
      if (!result.isSafe) {
        expect(result.violationKind).toBe('MALICIOUS_PHISHING');
        expect(result.reason).toMatch(/lừa đảo|Phishing/);
      }
    }
  });

  it('should reject direct IP address URLs to prevent SSRF', async () => {
    const ipUrls = [
      'http://192.168.1.1/admin',
      'https://10.0.0.1:8080/dashboard',
      'http://127.0.0.1/test',
      'http://8.8.8.8/',
    ];

    for (const url of ipUrls) {
      const result = await service.checkUrlSafety(url);
      expect(result.isSafe).toBe(false);
      if (!result.isSafe) {
        expect(result.violationKind).toBe('DIRECT_IP_DISALLOWED');
        expect(result.reason).toContain('địa chỉ IP trực tiếp');
      }
    }
  });

  it('should reject ToolHub domain and secondary shorteners', async () => {
    const shortenerUrls = [
      'https://toolhub.id.vn/abc',
      'https://bit.ly/sample',
      'https://tinyurl.com/xyz',
    ];

    for (const url of shortenerUrls) {
      const result = await service.checkUrlSafety(url);
      expect(result.isSafe).toBe(false);
      if (!result.isSafe) {
        expect(['TOOLHUB_DOMAIN', 'LOOPBACK_SHORTENER']).toContain(
          result.violationKind,
        );
      }
    }
  });

  it('should reject invalid, credentials, non-http, or excessively long URLs', async () => {
    const invalidInputs = [
      '',
      '   ',
      'javascript:alert(1)',
      'data:text/html;base64,PHNjcmlwdD4=',
      'file:///etc/passwd',
      'https://user:password@example.com',
      'https://example.com/has space',
      'https://example.com/' + 'a'.repeat(2048),
    ];

    for (const input of invalidInputs) {
      const result = await service.checkUrlSafety(input);
      expect(result.isSafe).toBe(false);
      if (!result.isSafe) {
        expect(result.violationKind).toBe('INVALID_FORMAT');
      }
    }
  });

  it('should accept clean, legitimate URLs', async () => {
    const validUrls = [
      'https://google.com',
      'https://github.com/dndkhang-ekila/ekila-toolhub',
      'https://developer.mozilla.org/en-US/docs/Web/HTTP',
      'http://example.com/search?q=test',
    ];

    for (const url of validUrls) {
      const result = await service.checkUrlSafety(url);
      expect(result.isSafe).toBe(true);
      if (result.isSafe) {
        expect(result.normalizedUrl).toBe(new URL(url).toString());
        expect(result.hostname).toBeTruthy();
      }
    }
  });
});
