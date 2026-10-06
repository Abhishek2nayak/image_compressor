export type FormatName = 'JPEG' | 'PNG' | 'WebP' | 'AVIF';

interface FormatIconProps {
  format: FormatName;
  size?: number;
  className?: string;
}

/**
 * File-type badge for an image format: a page with a folded corner and a
 * coloured label band.
 *
 * The label is SVG text with `textLength` + `lengthAdjust`, so the band stays
 * the same width whatever font the platform substitutes.
 */
const PALETTE: Record<FormatName, { band: string; page: string; fold: string }> = {
  JPEG: { band: '#FF9F1C', page: '#FFF8EC', fold: '#FFDCA3' },
  PNG: { band: '#2563EB', page: '#EFF6FF', fold: '#BFDBFE' },
  WebP: { band: '#22C55E', page: '#F0FDF4', fold: '#BBF7D0' },
  AVIF: { band: '#7C3AED', page: '#F5F3FF', fold: '#DDD6FE' },
};

export function FormatIcon({ format, size = 48, className }: FormatIconProps) {
  const c = PALETTE[format];
  // Shorter strings get a slightly smaller box so letterforms stay legible.
  const fontSize = format.length > 3 ? 9 : 10.5;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label={`${format} file`}
      className={className}
    >
      {/* Page body with a cut corner */}
      <path
        d="M9 6a3 3 0 0 1 3-3h17l10 10v29a3 3 0 0 1-3 3H12a3 3 0 0 1-3-3V6Z"
        fill={c.page}
        stroke={c.band}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Folded corner */}
      <path d="M29 3l10 10h-7a3 3 0 0 1-3-3V3Z" fill={c.fold} />
      {/* Content lines, hinting at image data */}
      <path
        d="M15 20.5h12M15 25h18"
        stroke={c.fold}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Label band */}
      <rect x="5" y="29" width="38" height="13" rx="3.5" fill={c.band} />
      <text
        x="24"
        y="38.4"
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="800"
        letterSpacing="0.3"
        fill="#ffffff"
        fontFamily="system-ui, -apple-system, Segoe UI, sans-serif"
        textLength="30"
        lengthAdjust="spacingAndGlyphs"
      >
        {format.toUpperCase()}
      </text>
    </svg>
  );
}
