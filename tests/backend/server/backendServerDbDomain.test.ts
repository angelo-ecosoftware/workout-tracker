import { describe, it, expect, beforeEach } from 'vitest';
import { ProductScraperResult } from '../../../api/scraperRegistry.ts';

interface ServerAuditLog {
  id: string;
  endpoint: string;
  targetUrl: string;
  status: 'SUCCESS' | 'CACHE_HIT' | 'ERROR';
  statusCode: number;
  durationMs: number;
  timestamp: string;
}

class MockServerDatabaseDomain {
  private logs: ServerAuditLog[] = [];
  private productCache = new Map<string, { product: ProductScraperResult; timestamp: number }>();

  public recordRequest(entry: Omit<ServerAuditLog, 'id' | 'timestamp'>): ServerAuditLog {
    const log: ServerAuditLog = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString()
    };
    this.logs.push(log);
    return log;
  }

  public getLogs(): ServerAuditLog[] {
    return [...this.logs];
  }

  public getLogsByStatus(status: ServerAuditLog['status']): ServerAuditLog[] {
    return this.logs.filter(l => l.status === status);
  }

  public saveCachedProduct(url: string, product: ProductScraperResult) {
    this.productCache.set(url, { product, timestamp: Date.now() });
  }

  public getCachedProduct(url: string): ProductScraperResult | null {
    const entry = this.productCache.get(url);
    return entry ? entry.product : null;
  }
}

describe('Backend Server Database Domain & Audit Logging', () => {
  let db: MockServerDatabaseDomain;

  beforeEach(() => {
    db = new MockServerDatabaseDomain();
  });

  it('records endpoint audit logs and filters by response status', () => {
    db.recordRequest({
      endpoint: '/api/scrape-food',
      targetUrl: 'https://www.ah.nl/producten/product/wi123/melk',
      status: 'SUCCESS',
      statusCode: 200,
      durationMs: 340
    });

    db.recordRequest({
      endpoint: '/api/scrape-food',
      targetUrl: 'https://www.unknown.nl/item',
      status: 'ERROR',
      statusCode: 422,
      durationMs: 45
    });

    const successLogs = db.getLogsByStatus('SUCCESS');
    const errorLogs = db.getLogsByStatus('ERROR');

    expect(successLogs).toHaveLength(1);
    expect(errorLogs).toHaveLength(1);
    expect(successLogs[0].durationMs).toBe(340);
  });

  it('persists and retrieves cached product data with audit tracing', () => {
    const product: ProductScraperResult = {
      id: 'ah_wi456',
      name: 'Griekse Yoghurt 0% Vet',
      brand: 'Total',
      servingUnit: 'gram',
      kcalPer100g: 57,
      proteinPer100g: 10.3,
      carbsPer100g: 4.0,
      sugarPer100g: 4.0,
      fatPer100g: 0.0,
      fiberPer100g: 0.0,
      sourceUrl: 'https://www.ah.nl/producten/product/wi456/yoghurt'
    };

    db.saveCachedProduct(product.sourceUrl, product);
    const cached = db.getCachedProduct(product.sourceUrl);

    expect(cached).not.toBeNull();
    expect(cached?.name).toBe('Griekse Yoghurt 0% Vet');
    expect(cached?.proteinPer100g).toBe(10.3);
  });
});
