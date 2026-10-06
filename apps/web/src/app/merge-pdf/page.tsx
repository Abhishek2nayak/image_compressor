import type { Metadata } from 'next';
import { ToolHeader } from '@/components/layout/ToolHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { RelatedTools } from '@/components/layout/RelatedTools';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { toolMetadata } from '@/lib/metadata';
import { breadcrumbSchema, toolSchema } from '@/lib/schema';
import { toolBySlug } from '@/lib/site';
import MergePdfClient from './MergePdfClient';

const SLUG = '/merge-pdf';
const tool = toolBySlug(SLUG)!;

export const metadata: Metadata = toolMetadata(SLUG);

const crumbs = [
  { name: 'Home', path: '/' },
  { name: tool.name, path: SLUG },
];

export default function Page() {
  return (
    <>
      <JsonLd data={[toolSchema(tool), breadcrumbSchema(crumbs)]} />
      <ToolHeader activeSlug={SLUG} />
      <Breadcrumbs crumbs={crumbs} />
      <MergePdfClient />
      <RelatedTools activeSlug={SLUG} />
      <SiteFooter />
    </>
  );
}
