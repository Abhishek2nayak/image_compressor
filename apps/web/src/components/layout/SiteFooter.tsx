import Link from 'next/link';
import { FileText } from 'lucide-react';
import { BRAND, TOOLS } from '@/lib/site';

/**
 * Server component — the tool links are always present in the HTML, which is
 * what makes them crawlable internal links on every page.
 */
export function SiteFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid sm:grid-cols-4 gap-8 mb-10">
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-white" aria-hidden="true" />
              </div>
              <span className="font-bold text-white text-lg">{BRAND}</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              Free online PDF and image tools. No account needed, no watermarks on
              your files.
            </p>
          </div>

          <div>
            <h2 className="text-white font-bold text-sm mb-3">Tools</h2>
            <ul className="space-y-2 text-sm">
              {TOOLS.map(tool => (
                <li key={tool.slug}>
                  <Link href={tool.slug} className="hover:text-white transition-colors">
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-white font-bold text-sm mb-3">Account</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Sign in
                </Link>
              </li>
              <li>
                <a
                  href="https://mythosh.com/"
                  className="hover:text-white transition-colors"
                >
                  More Mythosh tools
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} {BRAND}. Part of Mythosh.</span>
          {/* Deliberately specific: a blanket "nothing is uploaded" claim would
              be false for the two server-side tools. */}
          <span>
            Merge, split and JPG&nbsp;to&nbsp;PDF run in your browser · image and PDF
            compression are processed on our servers
          </span>
        </div>
      </div>
    </footer>
  );
}
