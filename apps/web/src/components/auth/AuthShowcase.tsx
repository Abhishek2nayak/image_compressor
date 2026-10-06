import { Logo } from '@/components/brand/Logo';
import { ToolIcon } from '@/components/icons/ToolIcon';

/**
 * The visual half of the auth split-screen.
 *
 * Everything here depicts the product as it actually behaves — the drop zone,
 * a compression result, page thumbnails from the splitter. No stock photos,
 * no invented user counts, no testimonials.
 *
 * The content sits in a fixed max-width column that is centred in whatever
 * space the panel gets, so the composition stays tight instead of leaving a
 * dead gutter on wide screens.
 */
export function AuthShowcase() {
  return (
    <aside className="relative hidden lg:flex items-center justify-center overflow-hidden bg-blue-950 px-10 xl:px-14 py-12">
      {/* Depth: two brand glows plus a faint dot grid for texture */}
      <div
        className="absolute -top-40 -left-32 w-[560px] h-[560px] rounded-full blur-3xl opacity-40 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #FF1744 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-48 -right-32 w-[520px] h-[520px] rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)' }}
      />
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />

      <div className="relative w-full max-w-[420px]">
        <Logo size={40} light className="mb-8" />

        <h2 className="text-[2rem] xl:text-[2.25rem] font-black text-white leading-[1.15] mb-3.5">
          Seven PDF and image tools, free and without an account.
        </h2>
        <p className="text-blue-200/75 text-[0.9375rem] leading-relaxed">
          Signing in only raises your daily limit on the two compressors and
          lets you create an API key. Everything else already works without it.
        </p>

        {/* Overlapping cards, each one a real piece of the product */}
        <div className="mt-9 mb-9">
          {/* Drop zone */}
          <div className="relative z-10 -rotate-2 bg-white rounded-2xl p-3.5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)]">
            <div className="border-2 border-dashed border-red-200 rounded-xl py-6 flex flex-col items-center bg-red-50/40">
              <ToolIcon name="compress-image" size={34} />
              <span className="text-[13px] font-bold text-blue-950 mt-2">Drop your images</span>
              <span className="text-[11px] text-slate-400 mt-0.5">JPG · PNG · WebP · AVIF</span>
            </div>
          </div>

          {/* Compression result, tucked under and offset right */}
          <div className="relative z-20 rotate-1 -mt-3 ml-14 w-[270px] bg-white rounded-2xl p-3.5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-bold text-blue-950">photo.jpg</span>
              <span className="text-[11px] font-bold text-green-600">−68%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full w-[32%] rounded-full bg-brand-gradient" />
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
              <span>2.4 MB</span>
              <span className="text-blue-950 font-semibold">768 KB</span>
            </div>
          </div>

          {/* Page picker from the splitter */}
          <div className="relative z-30 -rotate-1 mt-4 mr-10 bg-white rounded-2xl p-3.5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)]">
            <div className="flex items-center gap-2 mb-2.5">
              <ToolIcon name="split-pdf" size={18} />
              <span className="text-[13px] font-bold text-blue-950">Select pages</span>
              <span className="ml-auto text-[11px] font-semibold text-slate-400">2 of 4</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map(n => (
                <div
                  key={n}
                  className={`aspect-[3/4] rounded-md border-2 flex items-end justify-center pb-1 ${
                    n <= 2 ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <span
                    className={`text-[9px] font-bold ${n <= 2 ? 'text-red-500' : 'text-slate-400'}`}
                  >
                    {n}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <ul className="space-y-2.5 text-[0.9375rem] text-blue-200/75">
          {[
            'Five of the seven tools never upload your file',
            'No watermarks, ever',
            'No email required to download',
          ].map(point => (
            <li key={point} className="flex items-start gap-2.5">
              <span
                className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-2"
                aria-hidden="true"
              />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
