import type { MetadataRoute } from 'next';

/**
 * Dynamic sitemap generator compliant with Google Search Console guidelines.
 * Exclusively indexes public pages (Homepage and Login) while guarding all
 * authenticated and administrative routes.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://kinisia.nl').replace(/\/+$/, '');

  return [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];
}
