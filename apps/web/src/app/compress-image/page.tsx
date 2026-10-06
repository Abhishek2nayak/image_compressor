import type { Metadata } from 'next';
import { ToolHeader } from '@/components/layout/ToolHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { toolMetadata } from '@/lib/metadata';
import CompressImageClient from './CompressImageClient';

export const metadata: Metadata = toolMetadata('/compress-image');

export default function Page() {
  return (
    <>
      <ToolHeader activeSlug="/compress-image" />
      <CompressImageClient />
      <SiteFooter />
    </>
  );
}
