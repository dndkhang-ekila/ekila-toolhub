import { Injectable } from '@nestjs/common';
import {
  AbuseReportRecord,
  AdminReportsFilter,
  AdminReportsQueryResult,
} from './links.types';

@Injectable()
export class ReportsRepository {
  private readonly reports = new Map<string, AbuseReportRecord>();

  constructor() {
    this.seedSampleReports();
  }

  seedSampleReports(): void {
    const now = new Date();
    const samples: AbuseReportRecord[] = [
      {
        id: 'rep_1',
        slug: 'old-landing',
        targetUrl: 'https://old.landingpage.com/archive',
        reason: 'PHISHING',
        details: 'Trang web mạo danh ngân hàng yêu cầu nhập mật khẩu OTP.',
        reporterEmail: 'victim@example.com',
        reporterIpHash: 'hash_ip_demo_1',
        status: 'PENDING',
        createdAt: new Date(now.getTime() - 3600000 * 2),
        updatedAt: new Date(now.getTime() - 3600000 * 2),
      },
      {
        id: 'rep_2',
        slug: 'fb-promo-2026',
        targetUrl:
          'https://toolhub.ekila.vn/campaign/summer-promo?utm_source=facebook&utm_medium=cpc',
        reason: 'SPAM',
        details: 'Gửi tin nhắn rác hàng loạt qua Facebook Messenger.',
        reporterEmail: 'user_reported@example.com',
        reporterIpHash: 'hash_ip_demo_2',
        status: 'PENDING',
        createdAt: new Date(now.getTime() - 3600000 * 5),
        updatedAt: new Date(now.getTime() - 3600000 * 5),
      },
      {
        id: 'rep_3',
        slug: 'malicious-site-example',
        targetUrl: 'http://malware-distributor.test/install.exe',
        reason: 'MALWARE',
        details: 'Tự động tải về file thực thi lạ khi mở liên kết.',
        reporterEmail: 'sec_researcher@example.com',
        reporterIpHash: 'hash_ip_demo_3',
        status: 'RESOLVED',
        actionTaken: 'DISABLED',
        adminNotes: 'Đã xác minh URL chứa malware và vô hiệu hóa link.',
        resolvedBy: 'admin_sys',
        resolvedAt: new Date(now.getTime() - 86400000),
        createdAt: new Date(now.getTime() - 86400000 * 2),
        updatedAt: new Date(now.getTime() - 86400000),
      },
    ];

    for (const report of samples) {
      this.reports.set(report.id, report);
    }
  }

  create(
    data: Omit<AbuseReportRecord, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
  ): Promise<AbuseReportRecord> {
    const now = new Date();
    const id = `rep_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newReport: AbuseReportRecord = {
      ...data,
      id,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };
    this.reports.set(id, newReport);
    return Promise.resolve({ ...newReport });
  }

  findById(id: string): Promise<AbuseReportRecord | null> {
    const report = this.reports.get(id);
    return Promise.resolve(report ? { ...report } : null);
  }

  findAll(filter: AdminReportsFilter = {}): Promise<AdminReportsQueryResult> {
    let all = Array.from(this.reports.values());

    const pendingCount = all.filter((r) => r.status === 'PENDING').length;
    const resolvedCount = all.filter((r) => r.status === 'RESOLVED').length;
    const dismissedCount = all.filter((r) => r.status === 'DISMISSED').length;

    if (filter.status && filter.status !== 'ALL') {
      all = all.filter((r) => r.status === filter.status);
    }

    if (filter.search) {
      const q = filter.search.toLowerCase();
      all = all.filter(
        (r) =>
          r.slug.toLowerCase().includes(q) ||
          r.targetUrl.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q) ||
          (r.details && r.details.toLowerCase().includes(q)),
      );
    }

    all.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const total = all.length;
    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, Math.min(100, filter.limit || 20));
    const start = (page - 1) * limit;
    const reports = all.slice(start, start + limit);

    return Promise.resolve({
      reports,
      total,
      pendingCount,
      resolvedCount,
      dismissedCount,
    });
  }

  update(
    id: string,
    updates: Partial<AbuseReportRecord>,
  ): Promise<AbuseReportRecord | null> {
    const existing = this.reports.get(id);
    if (!existing) return Promise.resolve(null);

    const updated: AbuseReportRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.reports.set(id, updated);
    return Promise.resolve({ ...updated });
  }

  countRecentByIp(ipHash: string, windowMs = 60000): number {
    const cutoff = Date.now() - windowMs;
    let count = 0;
    for (const r of this.reports.values()) {
      if (
        r.reporterIpHash === ipHash &&
        new Date(r.createdAt).getTime() >= cutoff
      ) {
        count++;
      }
    }
    return count;
  }
}
