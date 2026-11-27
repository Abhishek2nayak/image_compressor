import { MetadataRoute } from 'next';
import { TOOLS } from '@/lib/tools';

const BASE_URL = 'https://vyooom.com';

// Generated from the tool registry so new tools are never missing.
// Auth, pricing and /docs (redirects to /) are intentionally left out while they are disabled.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    ...TOOLS.map(t => ({
      url: `${BASE_URL}/${t.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    })),
  ];
}
