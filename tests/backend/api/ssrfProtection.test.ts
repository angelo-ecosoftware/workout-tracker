import { describe, it, expect } from 'vitest';
import { validateScraperTargetUrl } from '../../../api/scraperRegistry.ts';

describe('SSRF Protection & URL Validation [SEC-02]', () => {
  it('allows legitimate supermarket and drugstore domains', () => {
    expect(() => validateScraperTargetUrl('https://www.ah.nl/producten/product/wi12345')).not.toThrow();
    expect(() => validateScraperTargetUrl('https://www.jumbo.com/producten/kipfilet-123')).not.toThrow();
    expect(() => validateScraperTargetUrl('https://www.plus.nl/product/melk-123')).not.toThrow();
    expect(() => validateScraperTargetUrl('https://www.dirk.nl/boodschappen/brood/123')).not.toThrow();
    expect(() => validateScraperTargetUrl('https://picnic.app/nl/p/havermelk')).not.toThrow();
    expect(() => validateScraperTargetUrl('https://www.kruidvat.nl/p/protein-bar-123')).not.toThrow();
    expect(() => validateScraperTargetUrl('https://www.etos.nl/producten/creatine-powder-456')).not.toThrow();
    expect(() => validateScraperTargetUrl('https://www.hollandandbarrett.nl/shop/product/omega-3-789')).not.toThrow();
  });

  it('rejects loopback and private IP SSRF targets', () => {
    expect(() => validateScraperTargetUrl('http://127.0.0.1:3000/api/health')).toThrow(/forbidden|not permitted/);
    expect(() => validateScraperTargetUrl('http://localhost:3000/api/health')).toThrow(/forbidden|not permitted/);
    expect(() => validateScraperTargetUrl('http://169.254.169.254/latest/meta-data/')).toThrow(/forbidden|not permitted/);
    expect(() => validateScraperTargetUrl('http://10.0.0.1/admin')).toThrow(/forbidden|not permitted/);
    expect(() => validateScraperTargetUrl('http://192.168.1.1/router')).toThrow(/forbidden|not permitted/);
  });

  it('rejects untrusted third-party domains', () => {
    expect(() => validateScraperTargetUrl('https://malicious-site.example.com/exploit')).toThrow(/not permitted/);
    expect(() => validateScraperTargetUrl('https://google.com')).toThrow(/not permitted/);
  });

  it('rejects non-HTTP protocols', () => {
    expect(() => validateScraperTargetUrl('file:///etc/passwd')).toThrow();
    expect(() => validateScraperTargetUrl('ftp://ftp.example.com/file')).toThrow();
    expect(() => validateScraperTargetUrl('javascript:alert(1)')).toThrow();
  });
});
