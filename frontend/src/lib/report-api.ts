const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export type AbuseReportReason =
  | 'PHISHING'
  | 'MALWARE'
  | 'SPAM'
  | 'ADULT'
  | 'COPYRIGHT'
  | 'OTHER';

export type AbuseReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export type ReportActionTaken = 'DISABLED' | 'DELETED' | 'NONE';

export interface AbuseReportItem {
  id: string;
  slug: string;
  targetUrl: string;
  reason: AbuseReportReason;
  details?: string;
  reporterEmail?: string;
  reporterIpHash: string;
  status: AbuseReportStatus;
  actionTaken?: ReportActionTaken;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface SubmitReportInput {
  slug: string;
  reason: AbuseReportReason;
  details?: string;
  reporterEmail?: string;
}

export interface AdminReportsQueryResult {
  reports: AbuseReportItem[];
  total: number;
  pendingCount: number;
  resolvedCount: number;
  dismissedCount: number;
}

export interface UpdateReportActionInput {
  status: AbuseReportStatus;
  action?: 'DISABLE_LINK' | 'DELETE_LINK' | 'DISMISS' | 'NONE';
  adminNotes?: string;
}

export async function submitAbuseReport(
  input: SubmitReportInput,
): Promise<{ success: boolean; message: string; reportId: string }> {
  const res = await fetch(`${API_BASE}/links/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Không thể gửi báo cáo vi phạm');
  }

  return data;
}

export async function getAdminReports(params: {
  status?: AbuseReportStatus | 'ALL';
  search?: string;
  page?: number;
  limit?: number;
}): Promise<AdminReportsQueryResult> {
  const searchParams = new URLSearchParams();
  if (params.status && params.status !== 'ALL') {
    searchParams.set('status', params.status);
  }
  if (params.search) {
    searchParams.set('search', params.search);
  }
  if (params.page) {
    searchParams.set('page', String(params.page));
  }
  if (params.limit) {
    searchParams.set('limit', String(params.limit));
  }

  const res = await fetch(`${API_BASE}/admin/reports?${searchParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'admin',
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Không thể tải danh sách hàng đợi báo cáo');
  }

  return data;
}

export async function updateAdminReport(
  id: string,
  input: UpdateReportActionInput,
): Promise<AbuseReportItem> {
  const res = await fetch(`${API_BASE}/admin/reports/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'admin',
    },
    body: JSON.stringify(input),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Không thể cập nhật báo cáo vi phạm');
  }

  return data;
}
