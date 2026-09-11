import type { VercelRequest, VercelResponse } from '@vercel/node';
import sharp from 'sharp';

const ALLOWED_MEDIA_HOSTS = new Set(['static.exercisedb.dev']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const source = typeof req.query.src === 'string' ? req.query.src : '';

  try {
    const sourceUrl = new URL(source);
    if (!ALLOWED_MEDIA_HOSTS.has(sourceUrl.hostname) || !sourceUrl.pathname.endsWith('.gif')) {
      return res.status(400).json({ error: 'Unsupported exercise media source' });
    }

    const response = await fetch(sourceUrl);
    if (!response.ok) return res.status(response.status).end();

    const image = await sharp(Buffer.from(await response.arrayBuffer()), { animated: true, page: 0 })
      .resize(480, 480, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .webp({ quality: 88, effort: 4 })
      .toBuffer();

    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.status(200).send(image);
  } catch {
    return res.status(502).json({ error: 'Could not create exercise thumbnail' });
  }
}
