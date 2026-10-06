import { ChevronDown } from 'lucide-react';
import { TOOL_CONTENT } from '@/content/tool-content';

interface ToolArticleProps {
  slug: string;
}

/**
 * Server-rendered long-form content for a tool page. The h1 lives in the
 * interactive client component above this, so everything here starts at h2.
 *
 * The FAQ uses <details>, so the answers are in the HTML and the FAQPage
 * JSON-LD on the page is backed by content a reader can actually see.
 */
export function ToolArticle({ slug }: ToolArticleProps) {
  const content = TOOL_CONTENT[slug];
  if (!content) return null;

  return (
    <section className="bg-[#f8fafc] border-t border-slate-100 py-14">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-2xl font-black text-slate-900 mb-5">{content.heading}</h2>

        <div className="space-y-4 text-slate-600 leading-relaxed">
          {content.intro.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        <h3 className="text-lg font-bold text-slate-900 mt-10 mb-4">How to use it</h3>
        <ol className="space-y-4">
          {content.steps.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span
                className="shrink-0 w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-500 text-xs font-bold flex items-center justify-center"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-0.5">{step.title}</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <h3 className="text-lg font-bold text-slate-900 mt-10 mb-4">Limits</h3>
        <ul className="space-y-2">
          {content.limits.map(limit => (
            <li key={limit} className="text-sm text-slate-600 leading-relaxed flex gap-2.5">
              <span className="text-slate-300 shrink-0" aria-hidden="true">
                —
              </span>
              {limit}
            </li>
          ))}
        </ul>

        <h3 className="text-lg font-bold text-slate-900 mt-10 mb-4">
          Questions about this tool
        </h3>
        <div className="space-y-2.5">
          {content.faqs.map(faq => (
            <details
              key={faq.q}
              className="group border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm"
            >
              <summary className="flex items-center justify-between px-5 py-3.5 text-left gap-4 hover:bg-slate-50 transition-colors cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <h4 className="font-bold text-slate-800 text-sm leading-snug">{faq.q}</h4>
                <ChevronDown
                  className="w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3.5">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
