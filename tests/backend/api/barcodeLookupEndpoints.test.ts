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

    it('returns null if AH auth fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
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
