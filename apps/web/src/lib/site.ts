/**
 * Single source of truth for the site's identity and canonical URLs.
 *
 * Every canonical link, og:url, sitemap entry and JSON-LD URL derives from
 * SITE_URL. Change it here (or via NEXT_PUBLIC_SITE_URL) and nothing else.
 */

// No trailing slash — every helper below appends its own path.
export const SITE_URL = (
  process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://mypdfhub.mythosh.com'
).replace(/\/$/, '');

export const BRAND = 'My PDF Hub';

/** Absolute URL for a route path, e.g. absoluteUrl('/merge-pdf'). */
export function absoluteUrl(path = '/'): string {
  return path === '/' ? SITE_URL : `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Where the files are actually processed. Drives the privacy copy per tool. */
export type Processing = 'browser' | 'server';

export interface Tool {
  slug: string;
  /** Short label used in nav, cards and breadcrumbs. */
  name: string;
  /** <title> — kept under 60 characters including the brand suffix. */
  title: string;
  /** meta description — kept under 160 characters. */
  description: string;
  /** The single <h1> for the page. */
  h1: string;
  /** One-line summary used on the home page tool cards. */
  card: string;
  processing: Processing;
}

export const TOOLS: Tool[] = [
  {
    slug: '/compress-image',
    name: 'Compress Image',
    title: 'Compress Image Online — Reduce JPG, PNG Size',
    description:
      'Compress JPG, PNG, WebP and AVIF images online. Pick any quality level and reduce image size to the KB you need. Free, no sign-up.',
    h1: 'Compress images online',
    card: 'Reduce JPG, PNG, WebP and AVIF file sizes with a quality slider. Target a specific KB for forms and uploads.',
    processing: 'server',
  },
  {
    slug: '/jpg-to-pdf',
    name: 'JPG to PDF',
    title: 'JPG to PDF Converter — Free, In Your Browser',
    description:
      'Convert JPG, PNG, WebP and AVIF images into one PDF. Reorder, rotate and set A4 or Letter page size. Runs in your browser.',
    h1: 'Convert JPG to PDF',
    card: 'Turn images into a single PDF. Reorder, rotate, and choose A4, Letter or A3 with margins.',
    processing: 'browser',
  },
  {
    slug: '/merge-pdf',
    name: 'Merge PDF',
    title: 'Merge PDF Files Online — Free, No Upload',
    description:
      'Combine multiple PDF files into one. Drag to reorder, then download. Runs entirely in your browser, so no file is uploaded.',
    h1: 'Merge PDF files',
    card: 'Combine several PDFs into one and drag to reorder them. Nothing leaves your browser.',
    processing: 'browser',
  },
  {
    slug: '/split-pdf',
    name: 'Split PDF',
    title: 'Split PDF Online — Extract Pages Free',
    description:
      'Split a PDF or extract specific pages. Pick pages visually from thumbnails or split by range. Runs entirely in your browser.',
    h1: 'Split a PDF or extract pages',
    card: 'Extract the pages you pick, or split a PDF by range. Preview every page as a thumbnail first.',
    processing: 'browser',
  },
  {
    slug: '/compress-pdf',
    name: 'Compress PDF',
    title: 'Compress PDF Online — Reduce PDF File Size',
    description:
      'Reduce PDF file size online. Three compression levels, up to 100 MB. Your file is processed on our server and deleted immediately.',
    h1: 'Compress a PDF',
    card: 'Shrink a PDF by rebuilding its internal structure. Three levels, from safest to smallest.',
    processing: 'server',
  },
];

export function toolBySlug(slug: string): Tool | undefined {
  return TOOLS.find(t => t.slug === slug);
}

/** Routes that must stay out of the index: private, gated or duplicate. */
export const NOINDEX_ROUTES = [
  '/login',
  '/register',
  '/dashboard',
  '/api-keys',
  '/compress',
  '/auth/callback',
];
