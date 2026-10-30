import { Injectable } from '@nestjs/common';
import { LinkRecord } from './links.types';

@Injectable()
export class LinksRepository {
  private readonly storeBySlug = new Map<string, LinkRecord>();
  private readonly storeById = new Map<string, LinkRecord>();

  create(record: LinkRecord): Promise<LinkRecord> {
    const clone: LinkRecord = {
      ...record,
      uniqueDailyHashes: [...record.uniqueDailyHashes],
    };
    this.storeBySlug.set(record.slug, clone);
    this.storeById.set(record.id, clone);
    return Promise.resolve({ ...clone });
  }

  findBySlug(slug: string): Promise<LinkRecord | null> {
    const record = this.storeBySlug.get(slug);
    if (!record) {
      return Promise.resolve(null);
    }
    return Promise.resolve({
      ...record,
      uniqueDailyHashes: [...record.uniqueDailyHashes],
    });
  }

  findByOriginalUrlAndUserId(
    originalUrl: string,
    userId?: string,
  ): Promise<LinkRecord | null> {
    for (const record of this.storeBySlug.values()) {
      if (
        record.isActive &&
        record.originalUrl === originalUrl &&
        ((!userId && record.isGuest) || record.userId === userId)
      ) {
        return Promise.resolve({
          ...record,
          uniqueDailyHashes: [...record.uniqueDailyHashes],
        });
      }
    }
    return Promise.resolve(null);
  }

  recordClick(slug: string, anonymizedIpHash: string): Promise<boolean> {
    const record = this.storeBySlug.get(slug);
    if (!record || !record.isActive) {
      return Promise.resolve(false);
    }

    record.clickCount += 1;
    if (!record.uniqueDailyHashes.includes(anonymizedIpHash)) {
      record.uniqueDailyHashes.push(anonymizedIpHash);
    }

    return Promise.resolve(true);
  }

  delete(slug: string, userId?: string): Promise<boolean> {
    const record = this.storeBySlug.get(slug);
    if (!record) {
      return Promise.resolve(false);
    }

    if (userId && record.userId !== userId) {
      return Promise.resolve(false);
    }

    record.isActive = false;
    return Promise.resolve(true);
  }

  count(): Promise<number> {
    return Promise.resolve(this.storeBySlug.size);
  }

  clear(): Promise<void> {
    this.storeBySlug.clear();
    this.storeById.clear();
    return Promise.resolve();
  }
}
