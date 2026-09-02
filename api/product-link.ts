import type { VercelRequest, VercelResponse } from '@vercel/node';
import { scrapeProductFromUrl } from './scraperRegistry.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawUrl = (req.query.url as string) || (req.body && req.body.url);
  if (!rawUrl) {
    return res.status(400).json({ error: 'Missing required parameter: url' });
  }

  try {
    const product = await scrapeProductFromUrl(rawUrl);
    return res.status(200).json({
      success: true,
      product,
    });
  } catch (err: any) {
    console.error('Product Link Scraper Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to parse product link' });
  }
}
