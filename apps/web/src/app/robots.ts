import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/pricing', '/docs', '/register', '/login'],
        disallow: ['/dashboard/', '/api-keys/', '/api/'],
      },
    ],
    sitemap: 'https://imagepress.app/sitemap.xml',
  };
}
