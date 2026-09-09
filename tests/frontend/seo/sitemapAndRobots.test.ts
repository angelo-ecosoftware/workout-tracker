import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import sitemapSrc from '../../../src/app/sitemap';
import robotsSrc from '../../../src/app/robots';
import sitemapApp from '../../../app/sitemap';
import robotsApp from '../../../app/robots';

describe('SEO: Sitemap & Robots Generators', () => {
  const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.NEXT_PUBLIC_SITE_URL = originalEnv;
    } else {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    }
  });

  describe('sitemap generator', () => {
    it('returns exact Google Search Console-compliant routes with default domain', () => {
      const entries = sitemapSrc();
      expect(entries).toHaveLength(2);

      const homepage = entries.find((e) => e.url === 'https://kinisia.nl');
      expect(homepage).toBeDefined();
      expect(homepage?.priority).toBe(1.0);
      expect(homepage?.changeFrequency).toBe('daily');
      expect(homepage?.lastModified).toBeInstanceOf(Date);

      const loginPage = entries.find((e) => e.url === 'https://kinisia.nl/login');
      expect(loginPage).toBeDefined();
      expect(loginPage?.priority).toBe(0.8);
      expect(loginPage?.changeFrequency).toBe('monthly');
      expect(loginPage?.lastModified).toBeInstanceOf(Date);
    });

    it('respects NEXT_PUBLIC_SITE_URL environment variable without trailing slash', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://custom-domain.com/';
      const entries = sitemapApp();

      expect(entries[0].url).toBe('https://custom-domain.com');
      expect(entries[1].url).toBe('https://custom-domain.com/login');
    });

    it('does not include any protected dashboard or workout routes', () => {
      const entries = sitemapSrc();
      const urls = entries.map((e) => e.url);

      expect(urls.some((u) => u.includes('/dashboard'))).toBe(false);
      expect(urls.some((u) => u.includes('/tracker'))).toBe(false);
      expect(urls.some((u) => u.includes('/app'))).toBe(false);
      expect(urls.some((u) => u.includes('/api'))).toBe(false);
    });
  });

  describe('robots generator', () => {
    it('configures Googlebot and wildcard rules allowing only public routes', () => {
      const config = robotsSrc();

      expect(Array.isArray(config.rules)).toBe(true);
      const rules = config.rules as Array<{
        userAgent?: string | string[];
        allow?: string | string[];
        disallow?: string | string[];
      }>;

      const googlebotRule = rules.find((r) => r.userAgent === 'Googlebot');
      expect(googlebotRule).toBeDefined();
      expect(googlebotRule?.allow).toEqual(['/', '/login']);
      expect(googlebotRule?.disallow).toContain('/dashboard/*');
      expect(googlebotRule?.disallow).toContain('/app/*');
      expect(googlebotRule?.disallow).toContain('/tracker/*');
      expect(googlebotRule?.disallow).toContain('/api/*');

      expect(config.sitemap).toBe('https://kinisia.nl/sitemap.xml');
    });

    it('respects custom NEXT_PUBLIC_SITE_URL in sitemap reference', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://custom.nl';
      const config = robotsApp();
      expect(config.sitemap).toBe('https://custom.nl/sitemap.xml');
    });
  });

  describe('static public assets', () => {
    it('verifies public/sitemap.xml exists and contains valid XML for https://kinisia.nl', () => {
      const sitemapPath = path.resolve(process.cwd(), 'public/sitemap.xml');
      expect(fs.existsSync(sitemapPath)).toBe(true);
      const content = fs.readFileSync(sitemapPath, 'utf-8');
      expect(content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(content).toContain('<loc>https://kinisia.nl</loc>');
      expect(content).toContain('<loc>https://kinisia.nl/login</loc>');
      expect(content).not.toContain('/dashboard');
    });

    it('verifies public/robots.txt exists and contains valid crawler directives', () => {
      const robotsPath = path.resolve(process.cwd(), 'public/robots.txt');
      expect(fs.existsSync(robotsPath)).toBe(true);
      const content = fs.readFileSync(robotsPath, 'utf-8');
      expect(content).toContain('User-agent: Googlebot');
      expect(content).toContain('Allow: /');
      expect(content).toContain('Allow: /login');
      expect(content).toContain('Disallow: /dashboard/*');
      expect(content).toContain('Sitemap: https://kinisia.nl/sitemap.xml');
    });

    it('verifies vercel.json preserves XML and robots without rewriting to index.html', () => {
      const vercelPath = path.resolve(process.cwd(), 'vercel.json');
      expect(fs.existsSync(vercelPath)).toBe(true);
      const config = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));

      // Check headers
      const sitemapHeader = config.headers?.find((h: any) => h.source === '/sitemap.xml');
      expect(sitemapHeader).toBeDefined();
      const sitemapCt = sitemapHeader.headers.find((header: any) => header.key === 'Content-Type');
      expect(sitemapCt.value).toContain('application/xml');

      const robotsHeader = config.headers?.find((h: any) => h.source === '/robots.txt');
      expect(robotsHeader).toBeDefined();
      const robotsCt = robotsHeader.headers.find((header: any) => header.key === 'Content-Type');
      expect(robotsCt.value).toContain('text/plain');

      // Check rewrites regex: must not match .xml or .txt
      const spaRewrite = config.rewrites?.find((r: any) => r.destination === '/index.html');
      expect(spaRewrite).toBeDefined();
      const regex = new RegExp(`^${spaRewrite.source}$`);

      // File extensions must NOT be rewritten to index.html
      expect(regex.test('/sitemap.xml')).toBe(false);
      expect(regex.test('/robots.txt')).toBe(false);
      expect(regex.test('/manifest.webmanifest')).toBe(false);

      // SPA routes must be rewritten to index.html
      expect(regex.test('/login')).toBe(true);
      expect(regex.test('/dashboard')).toBe(true);
    });

    it('verifies vite.config.ts configures workbox navigateFallbackDenylist for sitemap and robots', () => {
      const viteConfigPath = path.resolve(process.cwd(), 'vite.config.ts');
      expect(fs.existsSync(viteConfigPath)).toBe(true);
      const content = fs.readFileSync(viteConfigPath, 'utf-8');

      expect(content).toContain('navigateFallbackDenylist');
      expect(content).toContain('/^\\/sitemap\\.xml$/');
      expect(content).toContain('/^\\/robots\\.txt$/');
    });
  });
});
