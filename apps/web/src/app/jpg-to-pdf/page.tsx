import type { Metadata } from 'next';
import { ToolHeader } from '@/components/layout/ToolHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { RelatedTools } from '@/components/layout/RelatedTools';
import { ToolArticle } from '@/components/ToolArticle';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { TOOL_CONTENT } from '@/content/tool-content';
import { toolMetadata } from '@/lib/metadata';
import { breadcrumbSchema, faqSchema, toolSchema } from '@/lib/schema';
import { toolBySlug } from '@/lib/site';
import JpgToPdfClient from './JpgToPdfClient';

const SLUG = '/jpg-to-pdf';
const tool = toolBySlug(SLUG)!;

export const metadata: Metadata = toolMetadata(SLUG);

const crumbs = [
  { name: 'Home', path: '/' },
  { name: tool.name, path: SLUG },
];

export default function Page() {
  // Every answer in faqSchema is rendered by <ToolArticle /> below.
  return (
    <>
      <JsonLd
        data={[
          toolSchema(tool),
          breadcrumbSchema(crumbs),
          faqSchema(TOOL_CONTENT[SLUG]!.faqs),
        ]}
      />
      <ToolHeader activeSlug={SLUG} />
      <Breadcrumbs crumbs={crumbs} />
      <JpgToPdfClient />
      <ToolArticle slug={SLUG} />
      <RelatedTools activeSlug={SLUG} />
      <SiteFooter />
    </>
  );
}
