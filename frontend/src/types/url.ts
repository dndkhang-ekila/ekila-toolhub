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
  error?: 'errorEmpty' | 'errorTooLong' | 'errorInvalidProtocol' | 'errorInvalidUrl' | 'errorUnsafeUrl';
  sanitizedUrl?: string;
}

export interface CreateShortUrlInput {
  url: string;
  customSlug?: string;
}

export interface SafetyCheckResponse {
  isSafe: boolean;
  reason?: string;
  violationKind?: string;
  matchedEntry?: string;
  threatDetail?: string;
}
