import type { Metadata } from 'next';
import { ToolHeader } from '@/components/layout/ToolHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { toolMetadata } from '@/lib/metadata';
import MergePdfClient from './MergePdfClient';

export const metadata: Metadata = toolMetadata('/merge-pdf');

export default function Page() {
  return (
    <>
      <ToolHeader activeSlug="/merge-pdf" />
      <MergePdfClient />
      <SiteFooter />
    </>
  );
}
