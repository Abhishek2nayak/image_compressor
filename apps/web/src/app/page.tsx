import type { Metadata } from 'next';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { JsonLd } from '@/components/seo/JsonLd';
import { HOME_FAQS } from '@/lib/faq';
import { pageMetadata } from '@/lib/metadata';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'My PDF Hub — Free PDF & Image Tools',
    description:
      'Free online tools to compress images, convert JPG to PDF, merge PDF, split PDF and compress PDF. No sign-up for any tool. Most run in your browser.',
    path: '/',
  }),
  keywords: [
    'compress image',
    'reduce image size',
    'compress jpg to 100kb',
    'jpg to pdf',
    'image to pdf converter',
    'merge pdf',
    'combine pdf files',
    'split pdf',
    'extract pdf pages',
    'compress pdf',
    'reduce pdf file size',
    'free pdf tools',
  ],
};

export default function Page() {
  // Safe to publish: every answer below is rendered on the page inside a
  // <details> element, so the markup and the schema agree.
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: HOME_FAQS.map(faq => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  };

  return (
    <>
      <JsonLd data={faqSchema} />
      <HomeClient />
      <SiteFooter />
    </>
  );
}
