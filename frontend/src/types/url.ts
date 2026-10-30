export interface ShortenedLink {
  id: string;
  originalUrl: string;
  shortUrl: string;
  slug: string;
  createdAt: string;
  clicks: number;
}

export interface UrlValidationResult {
  isValid: boolean;
  error?: 'errorEmpty' | 'errorTooLong' | 'errorInvalidProtocol' | 'errorInvalidUrl';
  sanitizedUrl?: string;
}

export interface CreateShortUrlInput {
  url: string;
  customSlug?: string;
}
