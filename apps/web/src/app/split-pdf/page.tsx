import type { Metadata } from 'next';
import { ToolHeader } from '@/components/layout/ToolHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { toolMetadata } from '@/lib/metadata';
import SplitPdfClient from './SplitPdfClient';

export const metadata: Metadata = toolMetadata('/split-pdf');

export default function Page() {
  return (
    <>
      <ToolHeader activeSlug="/split-pdf" />
      <SplitPdfClient />
      <SiteFooter />
    </>
  );
}
