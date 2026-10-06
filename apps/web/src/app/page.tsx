import type { Metadata } from 'next';
import { SiteFooter } from '@/components/layout/SiteFooter';
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
  return (
    <>
      <HomeClient />
      <SiteFooter />
    </>
  );
}
