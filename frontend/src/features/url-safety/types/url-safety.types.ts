export type UrlViolationKind =
  | 'INTERNAL_BLOCKLIST'
  | 'MALICIOUS_PHISHING'
  | 'MALICIOUS_MALWARE'
  | 'MALICIOUS_UNWANTED'
  | 'DIRECT_IP_DISALLOWED'
  | 'LOOPBACK_SHORTENER'
  | 'TOOLHUB_DOMAIN'
  | 'INVALID_FORMAT';

export type UrlSafetyCheckResult =
  | {
      ok: true;
      normalizedUrl: string;
      hostname: string;
    }
  | {
      ok: false;
      kind: UrlViolationKind;
      reason: string;
      threatDetail?: string;
      matchedEntry?: string;
    };

export interface ShortenedLinkRecord {
  id: string;
  originalUrl: string;
  slug: string;
  shortUrl: string;
  qrCodeDataUrl: string;
  createdAt: string;
  expiresAt: string;
  isGuest: boolean;
  clickCount: number;
}

export interface ExistingLinkPrompt {
  existingRecord: ShortenedLinkRecord;
  newRequestedSlug?: string;
}
