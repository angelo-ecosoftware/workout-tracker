import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import groceryListHandler from '../../../api/grocery-list.ts';
import productLinkHandler from '../../../api/product-link.ts';

// Lightweight mock HTTP request/response dispatcher
async function dispatchHandler(
  handler: any,
  query: Record<string, any> = {},
  body: Record<string, any> = {}
) {
  return new Promise<{ status: number; body: any }>((resolve) => {
    let statusCode = 200;
    const req: any = {
      query,
      body,
      headers: { 'content-type': 'application/json' },
    };

    const res: any = {
      status(code: number) {
        statusCode = code;
        return res;
      },
      json(data: any) {
        resolve({ status: statusCode, body: data });
        return res;
      },
      send(data: any) {
        resolve({ status: statusCode, body: data });
        return res;
      },
      setHeader() {
        return res;
      },
    };

    handler(req, res);
  });
}

describe('Backend API Endpoints - 5-Outcome Exhaustive Matrix', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /* -------------------------------------------------------------
   * 1. /api/grocery-list
   * ----------------------------------------------------------- */
  describe('/api/grocery-list API Endpoint', () => {
    it('❌ Outcome 2 (Validation 400): fails when listId is missing', async () => {
      const res = await dispatchHandler(groceryListHandler, {}, {});
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Missing required parameter: listId');
    });

    it('✅ Outcome 1 (Happy Path 200): exchanges guest token and resolves GraphQL items', async () => {
      // Mock Albert Heijn Mobile Auth & GraphQL APIs
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ access_token: 'fake_ah_token_123' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              groceryList: {
                groceryList: {
                  groceryItems: [
                    {
                      quantity: 2,
                      product: {
                        id: 'p_101',
                        title: 'Albert Heijn Halfvolle Melk',
                        brand: 'AH',
                        webPath: '/producten/product/wi101',
                        salesUnitSize: '1 L',
                      },
                    },
                  ],
                },
              },
            },
          }),
        });

      vi.stubGlobal('fetch', mockFetch);

      const res = await dispatchHandler(groceryListHandler, { listId: 'gl_test_88' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.totalItems).toBe(1);
      expect(res.body.products[0].title).toBe('Albert Heijn Halfvolle Melk');
      expect(res.body.products[0].quantity).toBe(2);
    });

    it('🛡️ Outcome 5 (Resilience / Upstream 502): handles Mobile Auth failure without access token', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}), // No access_token in payload
      });
      vi.stubGlobal('fetch', mockFetch);

      const res = await dispatchHandler(groceryListHandler, { listId: 'gl_missing_tok' });
      expect(res.status).toBe(502);
      expect(res.body.error).toContain('No access token received');
    });

    it('🛡️ Outcome 5 (Upstream 400 GraphQL Error): parses structured GraphQL error array', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ access_token: 'fake_ah_token_123' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            errors: [{ message: 'Grocery list not found or expired' }],
          }),
        });
      vi.stubGlobal('fetch', mockFetch);

      const res = await dispatchHandler(groceryListHandler, { listId: 'gl_invalid' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Grocery list not found or expired');
    });
  });

  /* -------------------------------------------------------------
   * 2. /api/product-link
   * ----------------------------------------------------------- */
  describe('/api/product-link Scraper Proxy', () => {
    it('❌ Outcome 2 (Validation 400): rejects request when url is omitted', async () => {
      const res = await dispatchHandler(productLinkHandler, {}, {});
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Missing required parameter: url');
    });

    it('❌ Outcome 2 (Validation 500/400): rejects or fails safely on unsupported supermarket domains', async () => {
      const res = await dispatchHandler(productLinkHandler, {}, {
        url: 'https://www.randomsupermarket.com/product/12345',
      });
      expect(res.status).toBe(500);
      expect(res.body.error).toContain('Could not load');
    });

    it('✅ Outcome 1 (Happy Path 200): correctly parses Albert Heijn product link', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => `
            <html>
              <head><title>AH Magere Kwark - Albert Heijn</title></head>
              <body>
                <h1>Magere Kwark</h1>
                <h2>Voedingswaarden</h2>
                <table>
                  <tr><td>Energie</td><td>52 kcal</td></tr>
                  <tr><td>Eiwitten</td><td>9.0 g</td></tr>
                  <tr><td>Koolhydraten</td><td>4.0 g</td></tr>
                  <tr><td>Vetten</td><td>0.1 g</td></tr>
                </table>
              </body>
            </html>
          `,
          json: async () => ({ access_token: 'fake_ah_token_456' }),
        });
      vi.stubGlobal('fetch', mockFetch);

      const res = await dispatchHandler(productLinkHandler, {}, {
        url: 'https://www.ah.nl/producten/product/wi999/ah-magere-kwark',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.product.name).toBe('Magere Kwark');
      expect(res.body.product.brand).toBe('AH');
      expect(res.body.product.proteinPer100g).toBe(9);
    });
  });
});
