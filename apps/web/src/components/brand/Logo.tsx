import Image from 'next/image';
import { LOGO } from '@/lib/brand';

interface LogoProps {
  /** Rendered height of the icon mark in px. Text scales with it. */
  size?: number;
  /** Hide the wordmark and show only the icon (mobile, tight spaces). */
  iconOnly?: boolean;
  /** Use light text, for dark backgrounds like the footer. */
  light?: boolean;
  className?: string;
}

/**
 * Brand lockup: the icon mark as an image, plus the wordmark as live text.
 *
 * The wordmark is text rather than part of the image so it stays crisp at any
 * size and costs nothing to load. The colour split (My / PDF / Hub) mirrors
 * the full logo artwork.
 */
export function Logo({ size = 32, iconOnly = false, light = false, className }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <Image
        src={LOGO.icon}
        alt=""
        width={size}
        height={size}
        priority
        className="shrink-0"
        style={{ width: size, height: size }}
      />
      {!iconOnly && (
        <span
          className="font-black tracking-tight whitespace-nowrap"
          style={{ fontSize: size * 0.56 }}
        >
          <span className={light ? 'text-white' : 'text-blue-950'}>My</span>
          <span className="text-red-500">PDF</span>
          <span className={light ? 'text-white' : 'text-blue-950'}>Hub</span>
        </span>
      )}
    </span>
  );
}

interface LogoFullProps {
  width?: number;
  className?: string;
  priority?: boolean;
}

/**
 * The full artwork lockup. Its glow is designed for dark backgrounds, so this
 * is used on the footer and the auth panel rather than on white.
 */
export function LogoFull({ width = 240, className, priority = false }: LogoFullProps) {
  // Source lockup is 480x262 after trimming.
  const height = Math.round((width * 262) / 480);
  return (
    <Image
      src={LOGO.full}
      alt="My PDF Hub"
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  );
}
