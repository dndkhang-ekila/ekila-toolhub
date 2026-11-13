import { Injectable } from '@nestjs/common';
import { LinkRecord } from './links.types';

@Injectable()
export class LinksRepository {
  private readonly storeBySlug = new Map<string, LinkRecord>();
  private readonly storeById = new Map<string, LinkRecord>();

  constructor() {}

  seedSampleData(): void {
    const now = new Date();
    const samples: LinkRecord[] = [
      {
        id: 'lnk_1',
        slug: 'ekila-docs',
        originalUrl: 'https://docs.ekila.vn/guides/introduction',
        shortUrl: 'https://toolhub.id.vn/ekila-docs',
        userId: 'usr_demo_123',
        isGuest: false,
        createdAt: new Date(now.getTime() - 86400000 * 5),
        expiresAt: new Date(now.getTime() + 86400000 * 25),
        clickCount: 142,
        uniqueDailyHashes: [],
        isActive: true,
      },
      {
        id: 'lnk_2',
        slug: 'fb-promo-2026',
        originalUrl:
          'https://toolhub.ekila.vn/campaign/summer-promo?utm_source=facebook&utm_medium=cpc',
        shortUrl: 'https://toolhub.id.vn/fb-promo-2026',
        userId: 'usr_demo_123',
        isGuest: false,
        createdAt: new Date(now.getTime() - 86400000 * 3),
        expiresAt: new Date(now.getTime() + 86400000 * 27),
        clickCount: 89,
        uniqueDailyHashes: [],
        isActive: true,
      },
      {
        id: 'lnk_3',
        slug: 'old-landing',
        originalUrl: 'https://old.landingpage.com/archive',
        shortUrl: 'https://toolhub.id.vn/old-landing',
        userId: 'usr_demo_123',
        isGuest: false,
        createdAt: new Date(now.getTime() - 86400000 * 10),
        expiresAt: new Date(now.getTime() + 86400000 * 20),
        clickCount: 25,
        uniqueDailyHashes: [],
        isActive: false,
      },
      {
        id: 'lnk_4',
        slug: 'github-repo',
        originalUrl: 'https://github.com/dndkhang-ekila/ekila-toolhub',
        shortUrl: 'https://toolhub.id.vn/github-repo',
        userId: 'usr_demo_123',
        isGuest: false,
        createdAt: new Date(now.getTime() - 86400000 * 7),
        expiresAt: new Date(now.getTime() + 86400000 * 23),
        clickCount: 310,
        uniqueDailyHashes: [],
        isActive: true,
      },
    ];

    for (const item of samples) {
      this.storeBySlug.set(item.slug.toLowerCase(), item);
      this.storeById.set(item.id, item);
    }
  }

  create(record: LinkRecord): Promise<LinkRecord> {
    const clone: LinkRecord = {
      ...record,
      uniqueDailyHashes: [...record.uniqueDailyHashes],
    };
    this.storeBySlug.set(record.slug.toLowerCase(), clone);
    this.storeById.set(record.id, clone);
    return Promise.resolve({ ...clone });
  }

  findById(id: string): Promise<LinkRecord | null> {
    const record = this.storeById.get(id);
    if (!record) {
      return Promise.resolve(null);
    }
    return Promise.resolve({
      ...record,
      uniqueDailyHashes: [...record.uniqueDailyHashes],
    });
  }

  findBySlug(slug: string): Promise<LinkRecord | null> {
    const record = this.storeBySlug.get(slug.toLowerCase());
    if (!record) {
      return Promise.resolve(null);
    }
    return Promise.resolve({
      ...record,
      uniqueDailyHashes: [...record.uniqueDailyHashes],
    });
  }

  async findByUserId(userId: string, search?: string): Promise<LinkRecord[]> {
    if (this.storeById.size === 0) {
      this.seedSampleData();
    }
    const keyword = (search || '').trim().toLowerCase();
    const result: LinkRecord[] = [];

    for (const record of this.storeById.values()) {
      const isOwner =
        record.userId === userId || record.userId === 'usr_demo_123';
      if (!isOwner) continue;

      if (keyword) {
        const matchSlug = record.slug.toLowerCase().includes(keyword);
        const matchUrl = record.originalUrl.toLowerCase().includes(keyword);
        if (!matchSlug && !matchUrl) continue;
      }

      result.push({
        ...record,
        uniqueDailyHashes: [...record.uniqueDailyHashes],
      });
    }

    result.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return Promise.resolve(result);
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

  update(
    id: string,
    updates: Partial<Pick<LinkRecord, 'originalUrl' | 'isActive'>>,
  ): Promise<LinkRecord | null> {
    const existing = this.storeById.get(id);
    if (!existing) {
      return Promise.resolve(null);
    }

    const updated: LinkRecord = {
      ...existing,
      ...updates,
      uniqueDailyHashes: [...existing.uniqueDailyHashes],
    };

    this.storeById.set(id, updated);
    this.storeBySlug.set(updated.slug.toLowerCase(), updated);
    return Promise.resolve({ ...updated });
  }

  recordClick(slug: string, anonymizedIpHash: string): Promise<boolean> {
    const record = this.storeBySlug.get(slug.toLowerCase());
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
    const record = this.storeBySlug.get(slug.toLowerCase());
    if (!record) {
      return Promise.resolve(false);
    }

    if (
      userId &&
      record.userId &&
      record.userId !== userId &&
      record.userId !== 'usr_demo_123'
    ) {
      return Promise.resolve(false);
    }

    this.storeBySlug.delete(record.slug.toLowerCase());
    this.storeById.delete(record.id);
    return Promise.resolve(true);
  }

  deleteById(id: string, userId?: string): Promise<boolean> {
    const record = this.storeById.get(id);
    if (!record) {
      return Promise.resolve(false);
    }

    if (
      userId &&
      record.userId &&
      record.userId !== userId &&
      record.userId !== 'usr_demo_123'
    ) {
      return Promise.resolve(false);
    }

    this.storeBySlug.delete(record.slug.toLowerCase());
    this.storeById.delete(id);
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
