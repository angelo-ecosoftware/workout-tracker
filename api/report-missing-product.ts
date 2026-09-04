import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const barcode = (req.query.barcode as string) || (req.body && req.body.barcode) || '';
  const name = (req.query.name as string) || (req.body && req.body.name) || '';
  const brand = (req.query.brand as string) || (req.body && req.body.brand) || '';
  const store = (req.query.store as string) || (req.body && req.body.store) || '';
  const notes = (req.query.notes as string) || (req.body && req.body.notes) || '';
  const userId = (req.query.userId as string) || (req.body && req.body.userId) || 'anonymous';

  if (!barcode && !name) {
    return res.status(400).json({ error: 'Please provide at least a barcode or product name to report.' });
  }

  const report = {
    id: `report_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    barcode: barcode.trim() || undefined,
    name: name.trim() || undefined,
    brand: brand.trim() || undefined,
    store: store.trim() || undefined,
    notes: notes.trim() || undefined,
    userId,
    timestamp: new Date().toISOString(),
    status: 'received',
  };

  console.log('[Missing Product Report Received by Developer API]:', JSON.stringify(report, null, 2));

  return res.status(200).json({
    success: true,
    message: 'Missing product report successfully submitted to developer API for indexing.',
    report,
  });
}
