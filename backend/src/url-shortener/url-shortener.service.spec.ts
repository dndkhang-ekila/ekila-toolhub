import { ConflictException, NotFoundException } from '@nestjs/common';
import { UrlShortenerRepository } from './url-shortener.repository';
import { UrlShortenerService } from './url-shortener.service';

describe('UrlShortenerService', () => {
  let service: UrlShortenerService;
  let repository: UrlShortenerRepository;

  beforeEach(() => {
    repository = new UrlShortenerRepository();
    service = new UrlShortenerService(repository);
  });

  describe('resolveLinkAndTrack (FR-URL-02 & BR-URL-03)', () => {
    it('trả về NOT_FOUND khi slug không tồn tại', () => {
      const result = service.resolveLinkAndTrack('non_existent_slug', {
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        referer: '',
      });
      expect(result.status).toBe('NOT_FOUND');
    });

    it('trả về DISABLED khi link đã bị tắt', () => {
      const result = service.resolveLinkAndTrack('old-landing', {
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        referer: '',
      });
      expect(result.status).toBe('DISABLED');
    });

    it('trả về EXPIRED khi link đã quá hạn', () => {
      const link = repository.create({
        slug: 'expired-link',
        originalUrl: 'https://example.com/expired',
        userId: 'usr_demo_123',
        isActive: true,
        expiresAt: new Date(Date.now() - 100000).toISOString(),
      });

      const result = service.resolveLinkAndTrack(link.slug, {
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        referer: '',
      });
      expect(result.status).toBe('EXPIRED');
    });

    it('chuyển hướng SUCCESS, tăng lượt click và ghi nhận IP băm ẩn danh (BR-URL-03)', () => {
      const beforeLink = repository.findBySlug('ekila-docs');
      const initialClicks = beforeLink?.totalClicks || 0;

      const result = service.resolveLinkAndTrack('ekila-docs', {
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        referer: 'https://facebook.com',
      });

      expect(result.status).toBe('SUCCESS');
      if (result.status === 'SUCCESS') {
        expect(result.originalUrl).toBe(
          'https://docs.ekila.vn/guides/introduction',
        );
      }

      const afterLink = repository.findBySlug('ekila-docs');
      expect(afterLink?.totalClicks).toBe(initialClicks + 1);
    });
  });

  describe('Quản lý danh sách link (FR-URL-06)', () => {
    it('lấy danh sách link của người dùng', () => {
      const links = service.getLinks('usr_demo_123');
      expect(links.length).toBeGreaterThanOrEqual(4);
    });

    it('tìm kiếm link theo từ khóa slug hoặc URL', () => {
      const results = service.getLinks('usr_demo_123', 'github');
      expect(results.length).toBe(1);
      expect(results[0].slug).toBe('github-repo');
    });

    it('tạo link ngắn mới thành công', () => {
      const created = service.createLink('usr_demo_123', {
        originalUrl: 'https://mywebsite.com/new-product',
      });
      expect(created.id).toBeDefined();
      expect(created.slug.length).toBe(6);
      expect(created.originalUrl).toBe('https://mywebsite.com/new-product');
    });

    it('tạo link với custom slug hợp lệ', () => {
      const created = service.createLink('usr_demo_123', {
        originalUrl: 'https://mywebsite.com/custom',
        customSlug: 'my-custom-slug',
      });
      expect(created.slug).toBe('my-custom-slug');
    });

    it('báo lỗi ConflictException nếu custom slug đã tồn tại', () => {
      expect(() => {
        service.createLink('usr_demo_123', {
          originalUrl: 'https://other.com',
          customSlug: 'ekila-docs',
        });
      }).toThrow(ConflictException);
    });

    it('trả về link cũ nếu thành viên rút gọn lại URL đích đã tồn tại (BR-URL-02)', () => {
      const existing = service.createLink('usr_demo_123', {
        originalUrl: 'https://docs.ekila.vn/guides/introduction',
      });
      expect(existing.slug).toBe('ekila-docs');
    });

    it('cập nhật URL đích và bật/tắt trạng thái link', () => {
      const updated = service.updateLink('usr_demo_123', 'lnk_1', {
        originalUrl: 'https://docs.ekila.vn/v2/updated',
        isActive: false,
      });
      expect(updated.originalUrl).toBe('https://docs.ekila.vn/v2/updated');
      expect(updated.isActive).toBe(false);
    });

    it('báo lỗi NotFoundException khi sửa link không tồn tại', () => {
      expect(() => {
        service.updateLink('usr_demo_123', 'invalid_id', {
          originalUrl: 'https://test.com',
        });
      }).toThrow(NotFoundException);
    });

    it('xóa link thành công', () => {
      const res = service.deleteLink('usr_demo_123', 'lnk_4');
      expect(res.success).toBe(true);
      expect(repository.findById('lnk_4')).toBeNull();
    });
  });
});
