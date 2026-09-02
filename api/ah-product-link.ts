export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let rawUrl = (req.query.url || req.body?.url) as string;
  if (!rawUrl || typeof rawUrl !== 'string') {
    return res.status(400).json({ error: 'Missing required parameter: url' });
  }

  try {
    let targetUrl = rawUrl.trim();
    if (!targetUrl.startsWith('http')) {
      if (targetUrl.startsWith('wi')) {
        targetUrl = `https://www.ah.nl/producten/product/${targetUrl}`;
      } else if (targetUrl.startsWith('/')) {
        targetUrl = `https://www.ah.nl${targetUrl}`;
      } else {
        targetUrl = `https://www.ah.nl/producten/product/${targetUrl}`;
      }
    }

    const pageRes = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!pageRes.ok) {
      return res.status(pageRes.status).json({
        error: `Could not load AH product page (status ${pageRes.status})`,
      });
    }

    const html = await pageRes.text();

    // 1. Title & Brand
    let title = 'Product';
    let brand = 'AH';
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (jsonLdMatch) {
      try {
        const parsed = JSON.parse(jsonLdMatch[1]);
        if (parsed.name) {
          title = parsed.name
            .replace(/\s*bestellen\s*\|\s*Albert Heijn/i, '')
            .replace(/\s*\|\s*Albert Heijn/i, '')
            .trim();
        }
        if (parsed.brand && typeof parsed.brand === 'string') brand = parsed.brand;
        else if (parsed.brand?.name) brand = parsed.brand.name;
      } catch (e) {}
    }

    // 2. Nutrition Table
    let kcalPer100g = 0;
    let proteinPer100g = 0;
    let carbsPer100g = 0;
    let sugarPer100g = 0;
    let fatPer100g = 0;
    let fiberPer100g = 0;

    const start = html.indexOf('Voedingswaarden');
    if (start !== -1) {
      const end = html.indexOf('</table>', start);
      const tableSection = html.slice(start, end !== -1 ? end + 8 : start + 6000);
      const rows = tableSection.split(/<\/tr>/i);

      for (const r of rows) {
        const cleaned = r.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
        let m;

        if (cleaned.startsWith('energie') && cleaned.indexOf('referentie') === -1) {
          m = cleaned.match(/(\d+(?:[.,]\d+)?)\s*kcal/);
          if (m) kcalPer100g = parseFloat(m[1].replace(',', '.'));
        }
        if (cleaned.startsWith('vet ') || cleaned.startsWith('vetten ')) {
          m = cleaned.match(/(\d+(?:[.,]\d+)?)\s*g/);
          if (m) fatPer100g = parseFloat(m[1].replace(',', '.'));
        }
        if (cleaned.startsWith('waarvan suikers')) {
          m = cleaned.match(/(\d+(?:[.,]\d+)?)\s*g/);
          if (m) sugarPer100g = parseFloat(m[1].replace(',', '.'));
        }
        if (cleaned.startsWith('koolhydraten')) {
          m = cleaned.match(/(\d+(?:[.,]\d+)?)\s*g/);
          if (m) carbsPer100g = parseFloat(m[1].replace(',', '.'));
        }
        if (cleaned.startsWith('eiwit')) {
          m = cleaned.match(/(\d+(?:[.,]\d+)?)\s*g/);
          if (m) proteinPer100g = parseFloat(m[1].replace(',', '.'));
        }
        if (cleaned.startsWith('voedingsvezel') || cleaned.startsWith('vezel')) {
          m = cleaned.match(/(\d+(?:[.,]\d+)?)\s*g/);
          if (m) fiberPer100g = parseFloat(m[1].replace(',', '.'));
        }
      }
    }

    const wiMatch = targetUrl.match(/wi(\d+)/i);
    const productId = wiMatch ? `ah_wi${wiMatch[1]}` : `ah_${Date.now()}`;

    return res.status(200).json({
      success: true,
      product: {
        id: productId,
        name: title,
        brand,
        servingUnit: html.toLowerCase().includes('per 100 milliliter') ? 'ml' : 'gram',
        kcalPer100g,
        proteinPer100g,
        carbsPer100g,
        sugarPer100g,
        fatPer100g,
        fiberPer100g,
        sourceUrl: targetUrl,
      },
    });
  } catch (err: any) {
    console.error('AH Product Link Scraper Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to extract AH product data' });
  }
}
