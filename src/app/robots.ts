import type { MetadataRoute } from 'next';

/**
 * Dynamic robots generator configured for search engine crawlers.
 * Allows indexing exclusively for '/' and '/login', while disallowing all protected
 * application routes (e.g. /dashboard/*, /app/*, /tracker/*, /api/*).
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://kinisia.nl').replace(/\/+$/, '');

  const disallowedRoutes = [
    '/dashboard/*',
    '/app/*',
    '/tracker/*',
    '/history/*',
    '/dietary/*',
    '/coach/*',
    '/admin/*',
    '/settings/*',
    '/api/*',
  ];

  return {
    rules: [
      {
        userAgent: 'Googlebot',
        allow: ['/', '/login'],
        disallow: disallowedRoutes,
      },
      {
        userAgent: '*',
        allow: ['/', '/login'],
        disallow: disallowedRoutes,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
