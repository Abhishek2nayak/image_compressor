import type { Metadata } from 'next';
import { BRAND, absoluteUrl, toolBySlug } from './site';

interface PageMetaInput {
  title: string;
  description: string;
  /** Route path, e.g. '/merge-pdf'. Becomes the self-referencing canonical. */
  path: string;
  /** Set for gated/private pages that must stay out of the index. */
  noindex?: boolean;
}

/**
 * Builds metadata with a self-referencing absolute canonical and matching
 * og:url. Every indexable page goes through here so the two can never drift.
 */
export function pageMetadata({ title, description, path, noindex }: PageMetaInput): Metadata {
  const url = absoluteUrl(path);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'en_IN',
      siteName: BRAND,
      url,
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    ...(noindex
      ? { robots: { index: false, follow: false, googleBot: { index: false, follow: false } } }
      : {}),
  };
}

/** Metadata for a tool page, taken from the registry in site.ts. */
export function toolMetadata(slug: string): Metadata {
  const tool = toolBySlug(slug);
  if (!tool) throw new Error(`No tool registered for slug "${slug}"`);

  return pageMetadata({
    title: tool.title,
    description: tool.description,
    path: tool.slug,
  });
}
