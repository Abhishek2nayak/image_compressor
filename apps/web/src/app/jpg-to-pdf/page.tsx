import type { Metadata } from 'next';
import { ToolHeader } from '@/components/layout/ToolHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { toolMetadata } from '@/lib/metadata';
import JpgToPdfClient from './JpgToPdfClient';

export const metadata: Metadata = toolMetadata('/jpg-to-pdf');

export default function Page() {
  return (
    <>
      <ToolHeader activeSlug="/jpg-to-pdf" />
      <JpgToPdfClient />
      <SiteFooter />
    </>
  );
}
