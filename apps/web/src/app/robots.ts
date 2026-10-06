import { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Private or gated areas. These also carry a noindex meta tag; the
        // disallow here just saves crawl budget.
        disallow: [
          '/api/',
          '/dashboard',
          '/api-keys',
          '/compress',
          '/login',
          '/register',
          '/auth/',
        ],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  };
}
