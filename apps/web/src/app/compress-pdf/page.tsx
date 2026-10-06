import type { Metadata } from 'next';
import { ToolHeader } from '@/components/layout/ToolHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { toolMetadata } from '@/lib/metadata';
import CompressPdfClient from './CompressPdfClient';

export const metadata: Metadata = toolMetadata('/compress-pdf');

export default function Page() {
  return (
    <>
      <ToolHeader activeSlug="/compress-pdf" />
      <CompressPdfClient />
      <SiteFooter />
    </>
  );
}
