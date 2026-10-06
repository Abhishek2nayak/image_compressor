import Link from 'next/link';
import { FileText } from 'lucide-react';
import { BRAND, TOOLS } from '@/lib/site';

interface ToolHeaderProps {
  /** Slug of the current tool, so it is not linked to itself. */
  activeSlug?: string;
}

/**
 * Minimal header for tool pages. Server component, so the cross-tool links are
 * in the HTML — this is the internal link graph between the five tools.
 */
export function ToolHeader({ activeSlug }: ToolHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center shadow-sm">
            <FileText className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <span className="font-bold text-slate-900">{BRAND}</span>
        </Link>

        <nav aria-label="Tools" className="hidden md:flex items-center gap-5 text-sm">
          {TOOLS.filter(tool => tool.slug !== activeSlug).map(tool => (
            <Link
              key={tool.slug}
              href={tool.slug}
              className="text-slate-500 hover:text-slate-900 transition-colors"
            >
              {tool.name}
            </Link>
          ))}
        </nav>

        <Link
          href="/"
          className="text-sm text-slate-500 hover:text-slate-800 transition-colors shrink-0 md:hidden"
        >
          All tools
        </Link>
      </div>
    </header>
  );
}
