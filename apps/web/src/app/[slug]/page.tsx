import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool, TOOLS } from '@/lib/tools';
import { ToolRenderer } from '@/tools/ToolRenderer';
import { ToolShell } from '@/components/tool/ToolShell';

// Only visible tools are pre-rendered; anything else (including tools marked
// `hidden` in the registry) is a 404. Every visible tool needs an entry in
// src/tools/index.ts.
export const dynamicParams = false;

export function generateStaticParams() {
  return TOOLS.map(t => ({ slug: t.slug }));
}

const SHARE_IMAGE = { url: '/opengraph-image.png', width: 1200, height: 630, alt: 'VYOOOM — free tools that run in your browser' };

type Props ={ params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};
  const title = tool.title ?? tool.name;
  return {
    title,
    description: tool.description,
    keywords: tool.keywords,
    alternates: { canonical: `/${slug}` },
    // Setting openGraph here replaces the root one, so the share image is repeated explicitly.
    openGraph: { title, description: tool.description, url: `/${slug}`, type: 'website', siteName: 'VYOOOM', images: [SHARE_IMAGE] },
    twitter: { card: 'summary_large_image', title, description: tool.description, images: [SHARE_IMAGE.url] },
  };
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  return (
    <ToolShell tool={tool}>
      <ToolRenderer slug={slug} />
    </ToolShell>
  );
}
