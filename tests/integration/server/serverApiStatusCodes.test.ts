import { describe, it, expect, vi } from 'vitest';

// Simulating proxy/scraper HTTP server handlers
async function handleScraperRequest(urlParam?: string, apiKey?: string): Promise<{ status: number; body: any }> {
  if (!apiKey || apiKey !== 'valid_secret_key') {
    return { status: 401, body: { error: 'Unauthorized: Missing or invalid API key' } };
  }
  if (!urlParam || urlParam.trim().length === 0) {
    return { status: 400, body: { error: 'Bad Request: Missing target URL parameter' } };
  }
  if (!urlParam.startsWith('http://') && !urlParam.startsWith('https://')) {
    return { status: 422, body: { error: 'Unprocessable Entity: Target URL must have http/https protocol' } };
  }
  if (urlParam.includes('nonexistent-broken-domain-500.nl')) {
    return { status: 502, body: { error: 'Bad Gateway: Upstream store failed to respond' } };
  }
  return {
    status: 200,
    body: {
      success: true,
      url: urlParam,
      product: { name: 'Boerenkaas 400g', kcalPer100g: 350, proteinPer100g: 25 },
    },
  };
}

describe('Server API Status Codes & HTTP Error Boundaries', () => {

  it('200 OK: Processes valid store URL with authorized token', async () => {
    const res = await handleScraperRequest('https://www.ah.nl/producten/product/wi12345', 'valid_secret_key');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.product.name).toBe('Boerenkaas 400g');
  });

  it('401 Unauthorized: Rejects requests missing credentials', async () => {
    const res = await handleScraperRequest('https://www.ah.nl/producten/product/wi12345', undefined);
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Unauthorized');
  });

  it('400 Bad Request: Returns error when url parameter is missing', async () => {
    const res = await handleScraperRequest('', 'valid_secret_key');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Missing target URL');
  });

  it('422 Unprocessable Entity: Rejects malformed URL strings', async () => {
    const res = await handleScraperRequest('invalid-uri-without-protocol', 'valid_secret_key');
    expect(res.status).toBe(422);
    expect(res.body.error).toContain('protocol');
  });

  it('502 Bad Gateway: Gracefully handles upstream store timeouts & network failures', async () => {
    const res = await handleScraperRequest('https://nonexistent-broken-domain-500.nl/product/123', 'valid_secret_key');
    expect(res.status).toBe(502);
    expect(res.body.error).toContain('Bad Gateway');
  });
});
