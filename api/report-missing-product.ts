import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key) : null;
}

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
    barcode: barcode.trim() || null,
    name: name.trim() || null,
    brand: brand.trim() || null,
    store: store.trim() || null,
    notes: notes.trim() || null,
    user_id: userId,
    status: 'pending',
  };

  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('Missing Supabase configuration for missing-product report persistence');
    return res.status(503).json({ error: 'Report service is not configured' });
  }

  const { data: insertedReport, error } = await supabase
    .from('missing_product_reports')
    .insert(report)
    .select('id, barcode, name, brand, store, notes, user_id, status, created_at')
    .single();

  if (error) {
    console.error('Missing product report persistence failed:', error.message);
    return res.status(500).json({ error: 'Unable to save missing product report' });
  }

  return res.status(200).json({
    success: true,
    message: 'Missing product report successfully submitted to developer API for indexing.',
    report: insertedReport,
  });
}
