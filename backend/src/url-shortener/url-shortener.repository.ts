import { Injectable } from '@nestjs/common';
import { ClickEvent, Link } from './url-shortener.types';

@Injectable()
export class UrlShortenerRepository {
  private links: Map<string, Link> = new Map();
  private clicks: ClickEvent[] = [];

  constructor() {
    this.seedSampleData();
  }

  private seedSampleData() {
    // TODO: Thay the bang co so du lieu thuc te khi tich hop ORM
    const sampleLinks: Link[] = [
      {
        id: 'lnk_1',
        slug: 'ekila-docs',
        originalUrl: 'https://docs.ekila.vn/guides/introduction',
        userId: 'usr_demo_123',
        isActive: true,
        expiresAt: null,
        totalClicks: 142,
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: 'lnk_2',
        slug: 'fb-promo-2026',
        originalUrl:
          'https://toolhub.ekila.vn/campaign/summer-promo?utm_source=facebook&utm_medium=cpc',
        userId: 'usr_demo_123',
        isActive: true,
        expiresAt: null,
        totalClicks: 89,
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: 'lnk_3',
        slug: 'old-landing',
        originalUrl: 'https://old.landingpage.com/archive',
        userId: 'usr_demo_123',
        isActive: false,
        expiresAt: null,
        totalClicks: 25,
        createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'lnk_4',
        slug: 'github-repo',
        originalUrl: 'https://github.com/dndkhang-ekila/ekila-toolhub',
        userId: 'usr_demo_123',
        isActive: true,
        expiresAt: null,
        totalClicks: 310,
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
    ];

    for (const link of sampleLinks) {
      this.links.set(link.id, link);
    }
  }

  findBySlug(slug: string): Link | null {
    for (const link of this.links.values()) {
      if (link.slug.toLowerCase() === slug.toLowerCase()) {
        return link;
      }
    }
    return null;
  }

  findById(id: string): Link | null {
    return this.links.get(id) || null;
  }

  findByUserId(userId: string, search?: string): Link[] {
    const list: Link[] = [];
    const keyword = (search || '').trim().toLowerCase();

    for (const link of this.links.values()) {
      const isOwner =
        link.userId === userId ||
        link.userId === 'usr_demo_123' ||
        !link.userId;
      if (!isOwner) continue;

      if (keyword) {
        const matchSlug = link.slug.toLowerCase().includes(keyword);
        const matchUrl = link.originalUrl.toLowerCase().includes(keyword);
        if (!matchSlug && !matchUrl) continue;
      }

      list.push({ ...link });
    }

    return list.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  findByOriginalUrlAndUserId(originalUrl: string, userId: string): Link | null {
    for (const link of this.links.values()) {
      if (link.userId === userId && link.originalUrl === originalUrl) {
        return link;
      }
    }
    return null;
  }

  create(
    data: Omit<Link, 'id' | 'totalClicks' | 'createdAt' | 'updatedAt'>,
  ): Link {
    const id = 'lnk_' + Math.random().toString(36).substring(2, 10);
    const now = new Date().toISOString();
    const newLink: Link = {
      ...data,
      id,
      totalClicks: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.links.set(id, newLink);
    return newLink;
  }

  update(
    id: string,
    updates: Partial<Pick<Link, 'originalUrl' | 'isActive' | 'expiresAt'>>,
  ): Link | null {
    const link = this.links.get(id);
    if (!link) return null;

    const updatedLink: Link = {
      ...link,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.links.set(id, updatedLink);
    return updatedLink;
  }

  delete(id: string): boolean {
    return this.links.delete(id);
  }

  incrementClicks(id: string): void {
    const link = this.links.get(id);
    if (link) {
      link.totalClicks += 1;
      link.updatedAt = new Date().toISOString();
    }
  }

  recordClick(event: ClickEvent): void {
    this.clicks.push(event);
  }
}
