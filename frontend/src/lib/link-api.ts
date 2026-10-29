import { tokenStorage } from './api';
import {
  CreateLinkInput,
  LinkItem,
  ResolveSlugResponse,
  UpdateLinkInput,
  UtmParams,
} from '@/types/link';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = tokenStorage.get();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const user = tokenStorage.getUser();
  if (user?.id) {
    headers['x-user-id'] = user.id;
  } else {
    // TODO: Su dung mock ID demo cho moi truong development khi chua co session
    headers['x-user-id'] = 'usr_demo_123';
  }

  return headers;
}

export function buildUrlWithUtm(baseUrl: string, utm: UtmParams): string {
  try {
    const url = new URL(baseUrl);
    if (utm.source.trim()) url.searchParams.set('utm_source', utm.source.trim());
    if (utm.medium.trim()) url.searchParams.set('utm_medium', utm.medium.trim());
    if (utm.campaign.trim()) url.searchParams.set('utm_campaign', utm.campaign.trim());
    if (utm.term?.trim()) url.searchParams.set('utm_term', utm.term.trim());
    if (utm.content?.trim()) url.searchParams.set('utm_content', utm.content.trim());
    return url.toString();
  } catch {
    try {
      const url = new URL(`https://${baseUrl}`);
      if (utm.source.trim()) url.searchParams.set('utm_source', utm.source.trim());
      if (utm.medium.trim()) url.searchParams.set('utm_medium', utm.medium.trim());
      if (utm.campaign.trim()) url.searchParams.set('utm_campaign', utm.campaign.trim());
      if (utm.term?.trim()) url.searchParams.set('utm_term', utm.term.trim());
      if (utm.content?.trim()) url.searchParams.set('utm_content', utm.content.trim());
      return url.toString();
    } catch {
      return baseUrl;
    }
  }
}

export async function fetchLinks(search?: string): Promise<LinkItem[]> {
  const url = new URL(`${API_BASE_URL}/links`);
  if (search) {
    url.searchParams.set('search', search);
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error('Không thể tải danh sách liên kết');
  }

  return res.json();
}

export async function createShortLink(input: CreateLinkInput): Promise<LinkItem> {
  const res = await fetch(`${API_BASE_URL}/links`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Lỗi khi tạo liên kết ngắn');
  }

  return res.json();
}

export async function updateShortLink(
  id: string,
  input: UpdateLinkInput,
): Promise<LinkItem> {
  const res = await fetch(`${API_BASE_URL}/links/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Lỗi khi cập nhật liên kết');
  }

  return res.json();
}

export async function deleteShortLink(
  id: string,
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/links/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Lỗi khi xóa liên kết');
  }

  return res.json();
}

export async function resolveSlug(slug: string): Promise<ResolveSlugResponse> {
  const res = await fetch(`${API_BASE_URL}/links/resolve/${encodeURIComponent(slug)}`, {
    method: 'GET',
  });

  if (!res.ok) {
    return { status: 'NOT_FOUND' };
  }

  return res.json();
}
