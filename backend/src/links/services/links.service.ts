import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { CreateShortLinkDto } from '../dto/create-short-link.dto';
import { LinksRepository } from '../links.repository';
import { CreateLinkResult, LinkRecord } from '../links.types';
import { UrlSafetyService } from './url-safety.service';

@Injectable()
export class LinksService {
  constructor(
    private readonly linksRepository: LinksRepository,
    private readonly urlSafetyService: UrlSafetyService,
    private readonly configService: ConfigService,
  ) {}

  generateSafeSlug(): string {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let slug = '';
    const bytes = crypto.randomBytes(7);
    for (let i = 0; i < 7; i++) {
      slug += chars[bytes[i] % chars.length];
    }
    return slug;
  }

  hashIpDaily(rawIp?: string): string {
    const ip = rawIp || '127.0.0.1';
    const dateStr = new Date().toISOString().slice(0, 10);
    const saltSecret =
      this.configService.get<string>('IP_HASH_SECRET') ||
      'toolhub-daily-rotation-salt';
    return crypto
      .createHash('sha256')
      .update(`${ip}:${dateStr}:${saltSecret}`)
      .digest('hex');
  }

  async createShortLink(
    dto: CreateShortLinkDto,
    userId?: string,
  ): Promise<CreateLinkResult> {
    const safetyResult = await this.urlSafetyService.checkUrlSafety(
      dto.originalUrl,
    );

    if (!safetyResult.isSafe) {
      throw new UnprocessableEntityException({
        statusCode: 422,
        message: safetyResult.reason,
        violationKind: safetyResult.violationKind,
        matchedEntry: safetyResult.matchedEntry,
        threatDetail: safetyResult.threatDetail,
      });
    }

    const isGuest = !userId;

    if (!dto.forceNew && !dto.customSlug) {
      const existing = await this.linksRepository.findByOriginalUrlAndUserId(
        safetyResult.normalizedUrl,
        userId,
      );
      if (existing) {
        return {
          link: existing,
          isDuplicate: true,
          message:
            'Bạn đã từng tạo liên kết rút gọn cho URL này. Bạn có thể sử dụng lại liên kết cũ hoặc tạo mới (BR-URL-02).',
        };
      }
    }

    let slug = '';
    if (dto.customSlug) {
      const normalizedCustom = dto.customSlug.trim().toLowerCase();
      const existingWithSlug =
        await this.linksRepository.findBySlug(normalizedCustom);
      if (existingWithSlug) {
        throw new ConflictException(
          'Đuôi liên kết tùy chỉnh (slug) này đã tồn tại. Vui lòng chọn đuôi khác.',
        );
      }
      slug = normalizedCustom;
    } else {
      let attempts = 0;
      while (attempts < 10) {
        const candidate = this.generateSafeSlug();
        const existing = await this.linksRepository.findBySlug(candidate);
        if (!existing) {
          slug = candidate;
          break;
        }
        attempts++;
      }
      if (!slug) {
        slug = this.generateSafeSlug() + Date.now().toString(36).slice(-2);
      }
    }

    const appBaseUrl =
      this.configService.get<string>('APP_URL') ||
      this.configService.get<string>('FRONTEND_URL') ||
      'https://toolhub.id.vn';
    const shortUrl = `${appBaseUrl.replace(/\/+$/, '')}/${slug}`;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const newRecord: LinkRecord = {
      id: `lnk_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      originalUrl: safetyResult.normalizedUrl,
      slug,
      shortUrl,
      userId,
      isGuest,
      createdAt: now,
      expiresAt,
      clickCount: 0,
      uniqueDailyHashes: [],
      isActive: true,
    };

    const saved = await this.linksRepository.create(newRecord);

    return {
      link: saved,
      isDuplicate: false,
    };
  }

  async resolveRedirect(slug: string, clientIp?: string): Promise<string> {
    const record = await this.linksRepository.findBySlug(slug);

    if (!record || !record.isActive) {
      throw new NotFoundException(
        'Liên kết rút gọn không tồn tại hoặc đã bị tắt.',
      );
    }

    const now = new Date();
    if (record.isGuest && now > record.expiresAt && record.clickCount === 0) {
      throw new NotFoundException(
        'Liên kết rút gọn của khách đã hết hạn sau 30 ngày không có lượt nhấp (BR-URL-01).',
      );
    }

    const hashedIp = this.hashIpDaily(clientIp);
    await this.linksRepository.recordClick(slug, hashedIp);

    return record.originalUrl;
  }

  async getLinkDetails(slug: string): Promise<LinkRecord> {
    const record = await this.linksRepository.findBySlug(slug);
    if (!record || !record.isActive) {
      throw new NotFoundException('Không tìm thấy liên kết rút gọn.');
    }
    return record;
  }

  async deleteLink(
    slug: string,
    userId?: string,
  ): Promise<{ success: boolean; message: string }> {
    const record = await this.linksRepository.findBySlug(slug);
    if (!record || !record.isActive) {
      throw new NotFoundException('Không tìm thấy liên kết rút gọn.');
    }

    if (record.isGuest) {
      throw new ForbiddenException(
        'Liên kết của khách không thể chỉnh sửa hoặc xoá (BR-URL-01).',
      );
    }

    if (record.userId && record.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xoá liên kết này.');
    }

    await this.linksRepository.delete(slug, userId);
    return {
      success: true,
      message: 'Đã xoá liên kết rút gọn thành công.',
    };
  }
}
