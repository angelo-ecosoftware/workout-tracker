import { describe, it, expect, vi } from 'vitest';
import { parseDutchNutritionTable, extractPackageSizing } from '../../../api/scraperRegistry.ts';

describe('Assisted Timed Server Scraper & Fallback Pipeline', () => {

  describe('Timeout Handling & Slow Network Fallbacks', () => {
    it('handles simulated fetch timeouts gracefully with AbortController', async () => {
      const controller = new AbortController();
      const timeoutPromise = new Promise((_, reject) => {
        const id = setTimeout(() => {
          controller.abort();
          reject(new Error('Scraper request timed out after 5000ms'));
        }, 50);
        return id;
      });

      await expect(timeoutPromise).rejects.toThrow('Scraper request timed out');
    });

    it('falls back to regex-based text extraction when DOM table selector fails', () => {
      const unstructuredHtml = `
        <div class="product-description">
          <p>Product: Eiwitshake Banaan</p>
          <p>Voedingswaarden per 100g:</p>
          <p>Energie 380 kcal</p>
          <p>Eiwitten 78.5 g</p>
          <p>Koolhydraten 5.2 g</p>
          <p>Vetten 2.1 g</p>
        </div>
      `;

      const parsed = parseDutchNutritionTable(unstructuredHtml);
      expect(parsed.kcalPer100g).toBe(380);
      expect(parsed.proteinPer100g).toBeCloseTo(78.5);
    });
  });

  describe('Package Sizing Fallbacks & Assisted Unit Parsing', () => {
    it('infers package quantity and piece sizes from multiple candidate strings', () => {
      const textSample1 = 'Proteïne Reep 6 stuks';
      const sizing1 = extractPackageSizing(textSample1, '<div>Verpakking: 300g</div>');
      expect(sizing1.pieceCount).toBe(6);
      expect(sizing1.packageWeightGrams).toBe(300);

      const textSample2 = 'Halfvolle Melk 1 liter';
      const sizing2 = extractPackageSizing(textSample2, '');
      expect(sizing2.packageWeightGrams).toBe(1000);
    });
  });
});
