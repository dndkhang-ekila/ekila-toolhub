import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateAbuseReportDto } from '../dto/create-abuse-report.dto';
import { UpdateAbuseReportDto } from '../dto/update-abuse-report.dto';
import {
  AbuseReportRecord,
  AdminReportsFilter,
  AdminReportsQueryResult,
} from '../links.types';
import { LinksRepository } from '../links.repository';
import { ReportsRepository } from '../reports.repository';
import { hashIpWithDailySalt } from '../utils/links.utils';

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly linksRepository: LinksRepository,
    private readonly configService: ConfigService,
  ) {}

  async submitReport(
    dto: CreateAbuseReportDto,
    clientIp: string,
  ): Promise<{ success: boolean; message: string; reportId: string }> {
    const salt =
      this.configService.get<string>('IP_HASH_SECRET') ||
      'toolhub_default_ip_hash_salt_2026';
    const ipHash = hashIpWithDailySalt(clientIp, salt);

    // Rate limit: max 5 reports per minute per hashed IP
    const recentCount = this.reportsRepository.countRecentByIp(ipHash, 60000);
    if (recentCount >= 5) {
      throw new HttpException(
        'Bạn đã gửi quá nhiều báo cáo trong thời gian ngắn. Vui lòng chờ 1 phút trước khi thử lại.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const normalizedSlug = this.normalizeSlug(dto.slug);
    if (!normalizedSlug) {
      throw new BadRequestException('Mã slug hoặc liên kết không hợp lệ.');
    }

    const link = await this.linksRepository.findBySlug(normalizedSlug);
    const targetUrl = link ? link.originalUrl : `/${normalizedSlug}`;

    const report = await this.reportsRepository.create({
      slug: normalizedSlug,
      targetUrl,
      reason: dto.reason,
      details: dto.details?.trim(),
      reporterEmail: dto.reporterEmail?.trim(),
      reporterIpHash: ipHash,
    });

    return {
      success: true,
      message:
        'Báo cáo liên kết vi phạm của bạn đã được ghi nhận và gửi đến hàng đợi quản trị viên.',
      reportId: report.id,
    };
  }

  async getAdminQueue(
    filter: AdminReportsFilter = {},
  ): Promise<AdminReportsQueryResult> {
    return this.reportsRepository.findAll(filter);
  }

  async getReportById(id: string): Promise<AbuseReportRecord> {
    const report = await this.reportsRepository.findById(id);
    if (!report) {
      throw new NotFoundException('Không tìm thấy báo cáo vi phạm.');
    }
    return report;
  }

  async handleAdminAction(
    id: string,
    dto: UpdateAbuseReportDto,
    adminUser = 'admin_sys',
  ): Promise<AbuseReportRecord> {
    const report = await this.reportsRepository.findById(id);
    if (!report) {
      throw new NotFoundException('Không tìm thấy báo cáo vi phạm.');
    }

    let actionTaken = report.actionTaken || 'NONE';
    let status = dto.status;
    const targetSlug = this.normalizeSlug(report.slug);

    if (dto.action === 'DISABLE_LINK') {
      const link = await this.linksRepository.findBySlug(targetSlug);
      if (link) {
        await this.linksRepository.update(link.id, { isActive: false });
      }
      actionTaken = 'DISABLED';
      status = 'RESOLVED';
    } else if (dto.action === 'DELETE_LINK') {
      const link = await this.linksRepository.findBySlug(targetSlug);
      if (link) {
        await this.linksRepository.delete(targetSlug, link.userId);
      }
      actionTaken = 'DELETED';
      status = 'RESOLVED';
    } else if (dto.action === 'DISMISS') {
      actionTaken = 'NONE';
      status = 'DISMISSED';
    }

    const updated = await this.reportsRepository.update(id, {
      status,
      actionTaken,
      adminNotes: dto.adminNotes?.trim() || report.adminNotes,
      resolvedBy: adminUser,
      resolvedAt: status !== 'PENDING' ? new Date() : undefined,
    });

    if (!updated) {
      throw new BadRequestException('Không thể cập nhật báo cáo.');
    }

    return updated;
  }

  private normalizeSlug(raw: string): string {
    const trimmed = (raw || '').trim();
    if (!trimmed) return '';

    let path = trimmed;
    if (/^https?:\/\//i.test(trimmed)) {
      try {
        path = new URL(trimmed).pathname;
      } catch {
        path = trimmed;
      }
    }

    path = path
      .split('?')[0]
      .split('#')[0]
      .replace(/^\/+|\/+$/g, '');
    if (path.startsWith('s/')) {
      path = path.slice(2);
    } else if (path.startsWith('api/v1/links/redirect/')) {
      path = path.slice('api/v1/links/redirect/'.length);
    } else if (path.startsWith('api/v1/links/r/')) {
      path = path.slice('api/v1/links/r/'.length);
    }

    const segments = path.split('/').filter(Boolean);
    return segments[segments.length - 1] || '';
  }
}
