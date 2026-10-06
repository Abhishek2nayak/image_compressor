import { Logo } from '@/components/brand/Logo';
import { ToolIcon } from '@/components/icons/ToolIcon';

/**
 * The visual half of the auth split-screen.
 *
 * Everything here depicts the product as it actually behaves — the drop zone,
 * a compression result, page thumbnails from the splitter. No stock photos,
 * no invented user counts, no testimonials.
 */
export function AuthShowcase() {
  return (
    <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-blue-950 p-10 xl:p-12">
      {/* Brand glow */}
      <div
        className="absolute -top-32 -left-24 w-[480px] h-[480px] rounded-full blur-3xl opacity-40 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #FF1744 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-40 -right-24 w-[460px] h-[460px] rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #FF4D8D 0%, transparent 70%)' }}
      />

      <div className="relative">
        <Logo size={44} light className="mb-10" />
        <h2 className="text-3xl xl:text-4xl font-black text-white leading-tight mb-4">
          Seven PDF and image tools,
          <br />
          free and without an account.
        </h2>
        <p className="text-blue-200/80 leading-relaxed max-w-md">
          Signing in is optional. It raises your daily limit on the two
          compressors and lets you create an API key — everything else works
          without it.
        </p>
      </div>

      {/* Floating cards, each one a real piece of the product */}
      <div className="relative my-10 space-y-4 max-w-sm">
        {/* Drop zone */}
        <div className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-2xl">
          <div className="border-2 border-dashed border-red-200 rounded-xl py-5 flex flex-col items-center">
            <ToolIcon name="compress-image" size={32} />
            <span className="text-xs font-bold text-blue-950 mt-2">Drop your images</span>
            <span className="text-[11px] text-slate-400 mt-0.5">JPG · PNG · WebP · AVIF</span>
          </div>
        </div>

        {/* Compression result */}
        <div className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-2xl ml-10">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-blue-950">photo.jpg</span>
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
        <div className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center gap-2 mb-3">
            <ToolIcon name="split-pdf" size={20} />
            <span className="text-xs font-bold text-blue-950">Select pages</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(n => (
              <div
                key={n}
                className={`aspect-[3/4] rounded-md border-2 flex items-end justify-center pb-1 ${
                  n <= 2 ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <span className="text-[9px] font-bold text-slate-400">{n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ul className="relative space-y-2.5 text-sm text-blue-200/80">
        {[
          'Five of the seven tools never upload your file',
          'No watermarks, ever',
          'No email required to download',
        ].map(point => (
          <li key={point} className="flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" aria-hidden="true" />
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}
