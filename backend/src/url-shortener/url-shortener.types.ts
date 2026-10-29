export interface Link {
  id: string;
  slug: string;
  originalUrl: string;
  userId: string | null;
  isActive: boolean;
  expiresAt: string | null;
  totalClicks: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClickEvent {
  id: string;
  linkId: string;
  timestamp: string;
  hashedIp: string;
  device: 'mobile' | 'desktop' | 'tablet' | 'other';
  browser: string;
  referer: string;
}

export type ResolveLinkResult =
  | { status: 'SUCCESS'; originalUrl: string }
  | { status: 'NOT_FOUND' }
  | { status: 'DISABLED' }
  | { status: 'EXPIRED' };
