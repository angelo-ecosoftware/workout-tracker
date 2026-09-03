import type { VercelRequest, VercelResponse } from '@vercel/node';
import { FoodItemNutrition } from '../src/models.ts';

const AH_HEADERS = {
  'Host': 'api.ah.nl',
  'x-application': 'AHWEBSHOP',
  'user-agent': 'Appie/8.8.2 Model/phone Android/7.0-API24',
  'content-type': 'application/json; charset=UTF-8',
};

/**
 * Resolves product details & macros directly from Albert Heijn Mobile Services API by EAN / GTIN barcode.
 */
export async function resolveAlbertHeijnBarcode(barcode: string): Promise<FoodItemNutrition | null> {
  const cleanBarcode = barcode.trim();
  if (!cleanBarcode) return null;

  try {
    // 1. Get anonymous guest token from AH Mobile Auth
    const authRes = await fetch('https://api.ah.nl/mobile-auth/v1/auth/token/anonymous', {
      method: 'POST',
      headers: AH_HEADERS,
      body: JSON.stringify({ clientId: 'appie' }),
    });

    if (!authRes.ok) {
      console.warn('AH Mobile Auth failed for barcode lookup:', authRes.status);
      return null;
    }

    const { access_token } = (await authRes.json()) as { access_token?: string };
    if (!access_token) return null;

    // 2. Query AH GTIN search endpoint
    const gtinUrl = `https://api.ah.nl/mobile-services/product/search/v1/gtin/${encodeURIComponent(cleanBarcode)}`;
    const gtinRes = await fetch(gtinUrl, {
      headers: {
        ...AH_HEADERS,
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!gtinRes.ok) {
      return null;
    }

    const card = await gtinRes.json();
    const webshopId = card.webshopId || card.id;
    if (!webshopId) return null;

    const title = card.title || 'AH Product';
    const brand = card.brand || 'AH';
    const salesUnitSize = card.salesUnitSize || '';

    // Extract package weight if available in salesUnitSize (e.g. "200 g", "500 g", "1 kg")
    let packageWeightGrams: number | undefined;
    if (salesUnitSize) {
      const gMatch = salesUnitSize.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gram|ml)\b/i);
      if (gMatch) {
        packageWeightGrams = Math.round(parseFloat(gMatch[1].replace(',', '.')));
      } else {
        const kgMatch = salesUnitSize.match(/(\d+(?:[.,]\d+)?)\s*kg\b/i);
        if (kgMatch) {
          packageWeightGrams = Math.round(parseFloat(kgMatch[1].replace(',', '.')) * 1000);
        }
      }
    }

    // 3. Fetch detailed tradeItem FIR information (contains verified Voedingswaarden)
    let kcalPer100g = 0;
    let proteinPer100g = 0;
    let carbsPer100g = 0;
    let sugarPer100g = 0;
    let fatPer100g = 0;
    let fiberPer100g = 0;

    try {
      const firUrl = `https://api.ah.nl/mobile-services/product/detail/v4/fir/${webshopId}`;
      const firRes = await fetch(firUrl, {
        headers: {
          ...AH_HEADERS,
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (firRes.ok) {
        const firData = await firRes.json();
        const nutrientHeaders = firData.tradeItem?.nutritionalInformation?.nutrientHeaders || [];
        const detailList = nutrientHeaders[0]?.nutrientDetail || [];

        for (const d of detailList) {
          const type = d.nutrientTypeCode?.value;
          const label = (d.nutrientTypeCode?.label || '').toLowerCase();
          const val = Number(d.quantityContained?.[0]?.value ?? 0);
          const unit = d.quantityContained?.[0]?.measurementUnitCode?.value;

          if ((type === 'ENER-' || label.includes('energie')) && unit === 'kcal') {
            kcalPer100g = Math.round(val);
          } else if (type === 'FAT' || label === 'vet') {
            fatPer100g = parseFloat(val.toFixed(1));
          } else if (type === 'SUGAR-' || label.includes('suikers')) {
            sugarPer100g = parseFloat(val.toFixed(1));
          } else if (type === 'CHOAVL' || (label.includes('koolhydraten') && !label.includes('waarvan'))) {
            carbsPer100g = parseFloat(val.toFixed(1));
          } else if (type === 'FIBTG' || label.includes('vezel')) {
            fiberPer100g = parseFloat(val.toFixed(1));
          } else if (type === 'PRO-' || label.includes('eiwit')) {
            proteinPer100g = parseFloat(val.toFixed(1));
          }
        }
      }
    } catch (firErr) {
      console.warn('Could not fetch FIR nutrient table for AH item:', firErr);
    }

    const cleanTitle = title.replace(/^AH\s+/i, '').trim();

    return {
      id: `ah_wi${webshopId}`,
      name: cleanTitle || title,
      brand,
      servingUnit: salesUnitSize.toLowerCase().includes('ml') ? 'ml' : 'gram',
      kcalPer100g,
      proteinPer100g,
      carbsPer100g,
      sugarPer100g,
      fatPer100g,
      fiberPer100g,
      packageWeightGrams,
      barcode: cleanBarcode,
      sourceUrl: `https://www.ah.nl/producten/product/wi${webshopId}`,
      isCustom: false,
    };
  } catch (err) {
    console.error('Error resolving barcode from Albert Heijn mobile services:', err);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const barcode = (req.query.barcode || req.body?.barcode) as string;
  if (!barcode || typeof barcode !== 'string') {
    return res.status(400).json({ error: 'Missing barcode parameter' });
  }

  const product = await resolveAlbertHeijnBarcode(barcode);
  if (!product) {
    return res.status(404).json({ error: `Barcode ${barcode} not found on Albert Heijn` });
  }

  return res.status(200).json(product);
}
