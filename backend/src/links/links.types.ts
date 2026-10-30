export type UrlViolationKind =
  | 'INTERNAL_BLOCKLIST'
  | 'MALICIOUS_MALWARE'
  | 'MALICIOUS_PHISHING'
  | 'MALICIOUS_UNWANTED'
  | 'DIRECT_IP_DISALLOWED'
  | 'LOOPBACK_SHORTENER'
  | 'TOOLHUB_DOMAIN'
  | 'INVALID_FORMAT';

export type SafetyCheckResult =
  | {
      isSafe: true;
      normalizedUrl: string;
      hostname: string;
    }
  | {
      isSafe: false;
      violationKind: UrlViolationKind;
      reason: string;
      matchedEntry?: string;
      threatDetail?: string;
    };

export interface LinkRecord {
  id: string;
  originalUrl: string;
  slug: string;
  shortUrl: string;
  userId?: string;
  isGuest: boolean;
  createdAt: Date;
  expiresAt: Date;
  clickCount: number;
  uniqueDailyHashes: string[];
  isActive: boolean;
}

export interface CreateLinkResult {
  link: LinkRecord;
  isDuplicate?: boolean;
  message?: string;
}
