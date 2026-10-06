import type { Faq } from './faq';
import { BRAND, SITE_URL, absoluteUrl, type Tool } from './site';

const ORG_ID = `${SITE_URL}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;

/** Organization — one node, referenced by @id from everything else. */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: BRAND,
    url: absoluteUrl('/'),
    // The hub that owns this and the other Mythosh tool sites.
    parentOrganization: {
      '@type': 'Organization',
      name: 'Mythosh',
      url: 'https://mythosh.com/',
    },
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': SITE_ID,
    name: BRAND,
    url: absoluteUrl('/'),
    publisher: { '@id': ORG_ID },
    inLanguage: 'en',
  };
}

/**
 * WebApplication for a tool page. `price: 0` is accurate — every tool is
 * usable without paying and without an account.
 */
export function toolSchema(tool: Tool) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${absoluteUrl(tool.slug)}#app`,
    name: `${tool.name} — ${BRAND}`,
    url: absoluteUrl(tool.slug),
    description: tool.description,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires a modern browser with JavaScript enabled.',
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
    publisher: { '@id': ORG_ID },
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbSchema(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/**
 * Only call this when the same answers are rendered on the page. A FAQPage
 * node describing answers that are not in the HTML is exactly the mismatch
 * that got removed from the home page.
 */
export function faqSchema(faqs: Faq[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  };
}
