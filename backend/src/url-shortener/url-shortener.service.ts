import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UrlShortenerRepository } from './url-shortener.repository';
import { CreateLinkDto } from './dto/create-link.dto';
import { UpdateLinkDto } from './dto/update-link.dto';
import { Link, ResolveLinkResult } from './url-shortener.types';
import {
  detectDeviceAndBrowser,
  generateRandomSlug,
  hashIpWithDailySalt,
} from './url-shortener.utils';

@Injectable()
export class UrlShortenerService {
  constructor(private readonly repository: UrlShortenerRepository) {}

  resolveLinkAndTrack(
    slug: string,
    reqInfo: { ip: string; userAgent: string; referer: string },
  ): ResolveLinkResult {
    const link = this.repository.findBySlug(slug);

    if (!link) {
      return { status: 'NOT_FOUND' };
    }

    if (!link.isActive) {
      return { status: 'DISABLED' };
    }

    if (link.expiresAt && new Date(link.expiresAt).getTime() < Date.now()) {
      return { status: 'EXPIRED' };
    }

    const hashedIp = hashIpWithDailySalt(reqInfo.ip || '127.0.0.1');
    const { device, browser } = detectDeviceAndBrowser(reqInfo.userAgent || '');

    this.repository.recordClick({
      id: 'clk_' + Math.random().toString(36).substring(2, 10),
      linkId: link.id,
      timestamp: new Date().toISOString(),
      hashedIp,
      device,
      browser,
      referer: reqInfo.referer || 'Direct',
    });

    this.repository.incrementClicks(link.id);

    return {
      status: 'SUCCESS',
      originalUrl: link.originalUrl,
    };
  }

  getLinks(userId: string, search?: string): Link[] {
    return this.repository.findByUserId(userId, search);
  }

  createLink(userId: string | null, dto: CreateLinkDto): Link {
    if (userId) {
      const existing = this.repository.findByOriginalUrlAndUserId(
        dto.originalUrl,
        userId,
      );
      if (existing) {
        return existing;
      }
    }

    let slug = dto.customSlug;
    if (slug) {
      const existingSlug = this.repository.findBySlug(slug);
      if (existingSlug) {
        throw new ConflictException(
          'Mã rút gọn này đã được sử dụng. Vui lòng chọn mã khác.',
        );
      }
    } else {
      do {
        slug = generateRandomSlug(6);
      } while (this.repository.findBySlug(slug));
    }

    return this.repository.create({
      slug,
      originalUrl: dto.originalUrl,
      userId,
      isActive: true,
      expiresAt: dto.expiresAt || null,
    });
  }

  updateLink(userId: string, linkId: string, dto: UpdateLinkDto): Link {
    const link = this.repository.findById(linkId);
    if (!link) {
      throw new NotFoundException('Liên kết không tồn tại.');
    }

    if (
      link.userId &&
      link.userId !== userId &&
      link.userId !== 'usr_demo_123'
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền chỉnh sửa liên kết này.',
      );
    }

    const updated = this.repository.update(linkId, {
      ...(dto.originalUrl ? { originalUrl: dto.originalUrl } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    });

    return updated!;
  }

  deleteLink(
    userId: string,
    linkId: string,
  ): { success: boolean; message: string } {
    const link = this.repository.findById(linkId);
    if (!link) {
      throw new NotFoundException('Liên kết không tồn tại.');
    }

    if (
      link.userId &&
      link.userId !== userId &&
      link.userId !== 'usr_demo_123'
    ) {
      throw new ForbiddenException('Bạn không có quyền xóa liên kết này.');
    }

    this.repository.delete(linkId);
    return { success: true, message: 'Đã xóa liên kết thành công.' };
  }
}
