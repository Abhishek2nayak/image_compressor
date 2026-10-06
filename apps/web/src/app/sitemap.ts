import { MetadataRoute } from 'next';
import { TOOLS, absoluteUrl } from '@/lib/site';

/**
 * Only indexable, self-canonical URLs belong here. Login, register, dashboard
 * and api-keys are noindex, so they are deliberately absent.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: absoluteUrl('/'),
      lastModified,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    ...TOOLS.map(tool => ({
      url: absoluteUrl(tool.slug),
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    })),
    {
      url: absoluteUrl('/pricing'),
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
}
