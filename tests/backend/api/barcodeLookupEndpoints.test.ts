import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveAlbertHeijnBarcode, resolveJumboBarcode } from '../../../api/barcode-lookup.ts';

global.fetch = vi.fn();

describe('api/barcode-lookup handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('resolveAlbertHeijnBarcode', () => {
    it('returns null when barcode is empty or invalid', async () => {
      const res = await resolveAlbertHeijnBarcode('');
      expect(res).toBeNull();
    });

    it('falls back to web search if AH mobile auth fails', async () => {
      // Mock mobile auth failure
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      // Mock subsequent web search success
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => `
          <html>
            <body>
              <a href="/producten/product/wi420734/molensteen-amandelmeel">Molensteen Amandelmeel</a>
            </body>
          </html>
        `,
      });

      // Mock subsequent product page fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => `
          <html>
            <script type="application/ld+json">
              {
                "@type": "Product",
                "name": "Molensteen Amandelmeel",
                "brand": { "name": "Molensteen" },
                "gtin13": "8719324872102"
              }
            </script>
            <table>
              <tr><th>Voedingswaarden</th><th>Per 100g</th></tr>
              <tr><td>Energie</td><td>605 kcal</td></tr>
              <tr><td>Eiwitten</td><td>22.5 g</td></tr>
              <tr><td>Koolhydraten</td><td>8.0 g</td></tr>
              <tr><td>Waarvan suikers</td><td>4.5 g</td></tr>
              <tr><td>Vetten</td><td>51.0 g</td></tr>
              <tr><td>Voedingsvezels</td><td>11.0 g</td></tr>
            </table>
          </html>
        `,
      });

      const res = await resolveAlbertHeijnBarcode('8719324872102');
      expect(res).not.toBeNull();
      expect(res?.id).toBe('ah_wi420734');
      expect(res?.name).toBe('Molensteen Amandelmeel');
      expect(res?.kcalPer100g).toBe(605);
      expect(res?.proteinPer100g).toBe(22.5);
    });

    it('returns null if both AH mobile auth and web search fail', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
      });

      const res = await resolveAlbertHeijnBarcode('8710400000001');
      expect(res).toBeNull();
    });
  });

  describe('resolveJumboBarcode', () => {
    it('returns null when barcode is empty or invalid', async () => {
      const res = await resolveJumboBarcode('');
      expect(res).toBeNull();
    });
  });
});
