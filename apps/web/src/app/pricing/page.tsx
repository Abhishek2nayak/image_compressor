import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/metadata';
import PricingClient from './PricingClient';

export const metadata: Metadata = pageMetadata({
  title: 'Pricing — Free & Pro Plans',
  description:
    'My PDF Hub pricing. Every tool is free to use without an account. Pro raises the daily limits, page counts and file size caps, and adds API access.',
  path: '/pricing',
});

export default function Page() {
  return <PricingClient />;
}
