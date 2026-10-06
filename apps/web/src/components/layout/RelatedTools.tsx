import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { TOOLS } from '@/lib/site';

interface RelatedToolsProps {
  /** Current tool, excluded from the list. */
  activeSlug: string;
}

/**
 * Contextual internal links at the foot of each tool page. Server-rendered, so
 * the four sibling links are crawlable without running the client bundle.
 */
export function RelatedTools({ activeSlug }: RelatedToolsProps) {
  const others = TOOLS.filter(tool => tool.slug !== activeSlug);

  return (
    <section className="bg-white border-t border-slate-100 py-14">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-2xl font-black text-slate-900 mb-2">Other tools</h2>
        <p className="text-slate-500 mb-8">
          All free, and none of them need an account.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {others.map(tool => (
            <Link
              key={tool.slug}
              href={tool.slug}
              className="group bg-[#f8fafc] rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <h3 className="font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                {tool.name}
                <ArrowRight
                  className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform"
                  aria-hidden="true"
                />
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">{tool.card}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
