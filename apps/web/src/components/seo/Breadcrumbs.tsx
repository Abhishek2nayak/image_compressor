import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { Crumb } from '@/lib/schema';

interface BreadcrumbsProps {
  /** Ordered trail. The last entry is the current page and is not linked. */
  crumbs: Crumb[];
}

/** Visible breadcrumb trail. Pairs with breadcrumbSchema() for the JSON-LD. */
export function Breadcrumbs({ crumbs }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="max-w-6xl mx-auto px-4 pt-5">
      <ol className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={crumb.path} className="flex items-center gap-1.5">
              {isLast ? (
                <span className="font-semibold text-slate-700" aria-current="page">
                  {crumb.name}
                </span>
              ) : (
                <>
                  <Link href={crumb.path} className="hover:text-slate-900 transition-colors">
                    {crumb.name}
                  </Link>
                  <ChevronRight className="w-3 h-3 text-slate-300" aria-hidden="true" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
