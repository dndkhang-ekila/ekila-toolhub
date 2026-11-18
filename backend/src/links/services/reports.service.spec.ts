import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateAbuseReportDto } from '../dto/create-abuse-report.dto';
import { LinksRepository } from '../links.repository';
import { ReportsRepository } from '../reports.repository';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let reportsRepo: ReportsRepository;
  let linksRepo: LinksRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        ReportsRepository,
        LinksRepository,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'IP_HASH_SECRET') return 'test_secret_salt_123';
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    reportsRepo = module.get<ReportsRepository>(ReportsRepository);
    linksRepo = module.get<LinksRepository>(LinksRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitReport', () => {
    it('successfully submits abuse report and anonymizes IP via hash', async () => {
      const dto: CreateAbuseReportDto = {
        slug: 'test-slug',
        reason: 'PHISHING',
        details: 'Trang web mạo danh ngân hàng lừa đảo người dùng.',
        reporterEmail: 'victim@test.com',
      };

      const result = await service.submitReport(dto, '192.168.1.100');

      expect(result.success).toBe(true);
      expect(result.reportId).toBeDefined();

      const saved = await reportsRepo.findById(result.reportId);
      expect(saved).toBeDefined();
      expect(saved?.slug).toBe('test-slug');
      expect(saved?.reason).toBe('PHISHING');
      expect(saved?.status).toBe('PENDING');
      expect(saved?.reporterIpHash).not.toContain('192.168.1.100');
      expect(saved?.reporterIpHash).toHaveLength(64);
    });

    it('enforces rate limiting when too many reports from same IP in 1 minute', async () => {
      const dto: CreateAbuseReportDto = {
        slug: 'spam-slug',
        reason: 'SPAM',
      };

      // Submit 5 reports
      for (let i = 0; i < 5; i++) {
        await service.submitReport(dto, '10.0.0.50');
      }

      // 6th report should throw 429
      await expect(service.submitReport(dto, '10.0.0.50')).rejects.toThrow(
        /quá nhiều báo cáo/i,
      );
    });
  });

  describe('admin moderation queue', () => {
    it('returns list of reports with counts and filtering', async () => {
      const result = await service.getAdminQueue({ status: 'PENDING' });

      expect(result.reports.length).toBeGreaterThan(0);
      expect(result.pendingCount).toBeGreaterThan(0);
      result.reports.forEach((r) => {
        expect(r.status).toBe('PENDING');
      });
    });

    it('handles admin action: disable violating link', async () => {
      // Seed a link in linksRepo
      await linksRepo.create({
        id: 'lnk_abuse_test',
        slug: 'bad-link',
        originalUrl: 'https://bad-site.com',
        shortUrl: 'https://toolhub.id.vn/bad-link',
        userId: 'usr_bad',
        isGuest: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        clickCount: 10,
        uniqueDailyHashes: [],
        isActive: true,
      });

      const reportRes = await service.submitReport(
        { slug: 'bad-link', reason: 'MALWARE' },
        '1.2.3.4',
      );

      const updated = await service.handleAdminAction(
        reportRes.reportId,
        {
          status: 'RESOLVED',
          action: 'DISABLE_LINK',
          adminNotes: 'Phát hiện mã độc, đã khóa liên kết.',
        },
        'admin_alice',
      );

      expect(updated.status).toBe('RESOLVED');
      expect(updated.actionTaken).toBe('DISABLED');
      expect(updated.resolvedBy).toBe('admin_alice');

      // Verify link in linksRepo is disabled
      const link = await linksRepo.findBySlug('bad-link');
      expect(link?.isActive).toBe(false);
    });

    it('handles admin action: dismiss false report', async () => {
      const reportRes = await service.submitReport(
        { slug: 'clean-slug', reason: 'OTHER', details: 'Báo cáo nhầm' },
        '1.2.3.5',
      );

      const dismissed = await service.handleAdminAction(
        reportRes.reportId,
        {
          status: 'DISMISSED',
          action: 'DISMISS',
          adminNotes: 'Không có dấu hiệu vi phạm.',
        },
        'admin_bob',
      );

      expect(dismissed.status).toBe('DISMISSED');
      expect(dismissed.actionTaken).toBe('NONE');
    });

    it('extracts slug when visitor pastes full short URL and disables it properly', async () => {
      await linksRepo.create({
        id: 'lnk_full_url_test',
        slug: '6h6kyft',
        originalUrl: 'https://phishing-target.example.com',
        shortUrl: 'http://localhost:3000/s/6h6kyft',
        userId: 'usr_1',
        isGuest: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        clickCount: 1,
        uniqueDailyHashes: [],
        isActive: true,
      });

      const reportRes = await service.submitReport(
        { slug: 'http://localhost:3000/s/6h6kyft', reason: 'PHISHING' },
        '1.2.3.9',
      );

      const saved = await reportsRepo.findById(reportRes.reportId);
      expect(saved?.slug).toBe('6h6kyft');
      expect(saved?.targetUrl).toBe('https://phishing-target.example.com');

      await service.handleAdminAction(
        reportRes.reportId,
        { status: 'RESOLVED', action: 'DISABLE_LINK' },
        'admin_sys',
      );

      const link = await linksRepo.findBySlug('6h6kyft');
      expect(link?.isActive).toBe(false);
    });
  });
});
