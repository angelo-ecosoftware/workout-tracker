import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler, { extractAlbertHeijnListId } from '../../../api/grocery-list.ts';

describe('Albert Heijn Shared Grocery List Resolver (api/grocery-list)', () => {
  describe('extractAlbertHeijnListId URL Parser', () => {
    it('extracts UUID from standard web URL', () => {
      const url = 'https://www.ah.nl/mijnlijst/gedeelde-lijst/2241f734-e626-45d6-804b-254efb8bf1a8';
      expect(extractAlbertHeijnListId(url)).toBe('2241f734-e626-45d6-804b-254efb8bf1a8');
    });

    it('extracts UUID from shortened or mobile URL with query parameters', () => {
      const url = 'https://ah.nl/gedeelde-lijst/550e8400-e29b-41d4-a716-446655440000?channel=app&utm_source=share';
      expect(extractAlbertHeijnListId(url)).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('extracts raw alphanumeric list ID from path', () => {
      const url = 'https://www.ah.nl/gedeelde-lijst/my_custom_list_123/';
      expect(extractAlbertHeijnListId(url)).toBe('my_custom_list_123');
    });

    it('handles raw UUID or ID string without URL scheme', () => {
      expect(extractAlbertHeijnListId('2241f734-e626-45d6-804b-254efb8bf1a8')).toBe('2241f734-e626-45d6-804b-254efb8bf1a8');
    });

    it('returns empty string for empty input', () => {
      expect(extractAlbertHeijnListId('')).toBe('');
    });
  });

  describe('Handler HTTP Lifecycle & Strategies', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('returns 400 when missing listId or url parameter', async () => {
      const req: any = { query: {}, body: {} };
      const res: any = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Missing required parameter') }));
    });

    it('detects and wraps single product links seamlessly', async () => {
      const req: any = { query: { listId: 'https://www.ah.nl/producten/product/wi12345/ah-halfvolle-melk' } };
      const res: any = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      // Mock fetch for single product link
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => `
          <html>
            <title>AH Halfvolle melk - Albert Heijn</title>
            <body>
              <h1>AH Halfvolle melk 1 l</h1>
              <table><tr><td>Energie</td><td>47 kcal</td></tr><tr><td>Eiwitten</td><td>3.5 g</td></tr></table>
            </body>
          </html>
        `,
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          listId: 'single_product',
          totalItems: 1,
        })
      );
    });

    it('resolves items from mobile GraphQL endpoint with anonymous token', async () => {
      const req: any = { query: { listId: '2241f734-e626-45d6-804b-254efb8bf1a8' } };
      const res: any = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      global.fetch = vi.fn()
        // 1. Mobile auth token
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'mock-access-token' }),
        })
        // 2. GraphQL sharedList query
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              groceryList: {
                statusCode: 200,
                groceryList: {
                  groceryItems: [
                    {
                      quantity: 2,
                      product: {
                        id: 54321,
                        title: 'AH Bananen',
                        brand: 'Albert Heijn',
                        webPath: '/producten/product/wi54321/ah-bananen',
                        salesUnitSize: '1 kg',
                      },
                    },
                  ],
                },
              },
            },
          }),
        })
        // 3. Scrape individual product nutrition
        .mockResolvedValueOnce({
          ok: true,
          text: async () => `
            <!DOCTYPE html>
            <html>
              <head>
                <script type="application/ld+json">
                {
                  "@context": "https://schema.org",
                  "@type": "Product",
                  "name": "AH Bananen",
                  "brand": { "@type": "Brand", "name": "Albert Heijn" }
                }
                </script>
              </head>
              <body>
                <h1>AH Bananen</h1>
                <table><tr><td>Voedingswaarde</td><td>Per 100g</td></tr><tr><td>Energie</td><td>88 kcal</td></tr><tr><td>Eiwitten</td><td>1.2 g</td></tr></table>
              </body>
            </html>
          `,
        });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          totalItems: 1,
          products: expect.arrayContaining([
            expect.objectContaining({
              id: 54321,
              title: expect.stringContaining('Bananen'),
            }),
          ]),
        })
      );
    });

    it('returns informative 404 error when shared list is not found or expired', async () => {
      const req: any = { query: { listId: '00000000-0000-0000-0000-000000000000' } };
      const res: any = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      global.fetch = vi.fn()
        // 1. Mobile auth token
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'mock-token' }),
        })
        // 2. GraphQL sharedList 404
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              groceryList: {
                statusCode: 404,
                groceryList: null,
              },
            },
          }),
        })
        // 3. GraphQL favoriteListV2 null
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: { favoriteListV2: null },
          }),
        })
        // 4. Web HTML scraper 404
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('could not be found or has expired'),
        })
      );
    });
  });
});
