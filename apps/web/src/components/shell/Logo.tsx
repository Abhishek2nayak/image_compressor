import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * The VYOOOM hummingbird: its raised wings form the V, and the lighter left
 * wing suggests motion. Colours come from tokens so it follows light/dark mode.
 * `flapping` animates the wings, for "working…" states.
 */
export function LogoMark({ className, flapping }: { className?: string; flapping?: boolean }) {
  return (
    <svg viewBox="34 24 600 600" className={cn('w-7 h-7 shrink-0 fill-brand-600', flapping && 'logo-flap', className)} aria-hidden="true">
      <path className="logo-wing-l" opacity=".62" d="M58 99C150 112 230 150 280 225C305 265 325 305 336 348L290 425C190 350 110 245 58 99Z" />
      <path className="logo-wing-r" d="M610 99C520 112 440 155 392 225C365 265 345 305 336 348L336 392 414 392C495 330 570 225 610 99Z" />
      <path d="M306 452 277 549 333 497 390 549 358 452Z" />
      <path d="M383 391 568 405 383 420Z" />
      <circle cx="333" cy="404" r="54" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" aria-label="VYOOOM home" className={cn('flex items-center gap-2 rounded-lg', className)}>
      <LogoMark />
      <span className="font-extrabold text-[17px] tracking-tight text-slate-900">VYOOOM</span>
    </Link>
  );
}
