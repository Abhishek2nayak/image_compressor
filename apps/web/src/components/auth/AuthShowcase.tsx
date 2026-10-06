import Image from 'next/image';
import { Logo } from '@/components/brand/Logo';

/**
 * The visual half of the auth split-screen.
 *
 * Brand artwork plus three factual lines about the product. No stock photos,
 * no invented user counts, no testimonials.
 *
 * The content sits in a fixed max-width column that is centred in whatever
 * space the panel gets, so the composition stays tight instead of leaving a
 * dead gutter on wide screens.
 */
export function AuthShowcase() {
  return (
    <aside className="relative hidden lg:flex items-center justify-center overflow-hidden bg-blue-950 px-10 xl:px-14 py-10 xl:py-12">
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

        {/* Brand artwork. Scaled by viewport height, because on a 720px-tall
            screen the illustration is what pushes the bullets off the panel. */}
        <div className="relative my-5 [@media(min-height:860px)]:my-8 flex justify-center">
          <div
            className="absolute inset-0 blur-3xl opacity-50 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #FF1744 0%, transparent 65%)' }}
          />
          <Image
            src="/assets/auth-illustration-760.webp"
            alt=""
            width={760}
            height={773}
            priority
            sizes="(min-height: 1000px) 340px, (min-height: 900px) 300px, (min-height: 800px) 250px, 190px"
            className="relative h-auto drop-shadow-2xl w-[190px] [@media(min-height:800px)]:w-[250px] [@media(min-height:900px)]:w-[300px] [@media(min-height:1000px)]:w-[340px]"
          />
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
