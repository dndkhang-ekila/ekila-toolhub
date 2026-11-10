export interface LinkItem {
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

export interface UtmParams {
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
}

export interface CreateLinkInput {
  originalUrl: string;
  customSlug?: string;
  expiresAt?: string;
}

export interface UpdateLinkInput {
  originalUrl?: string;
  isActive?: boolean;
}

export interface ResolveSlugResponse {
  status: 'SUCCESS' | 'NOT_FOUND' | 'DISABLED' | 'EXPIRED';
  originalUrl?: string;
}

