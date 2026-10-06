import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/metadata';
import HomeClient from './HomeClient';

export const metadata: Metadata = pageMetadata({
  title: 'My PDF Hub — Free PDF & Image Tools',
  description:
    'Free online tools to compress images, convert JPG to PDF, merge PDF, split PDF and compress PDF. No sign-up for any tool. Most run in your browser.',
  path: '/',
});

export default function Page() {
  return <HomeClient />;
}
