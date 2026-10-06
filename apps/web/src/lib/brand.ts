/**
 * Canonical brand values. Keep in sync with tailwind.config.ts.
 *
 * Use these for anything Tailwind classes cannot reach: inline SVG fills,
 * the generated OG image, theme-color meta, and JSON-LD.
 */
export const BRAND_COLORS = {
  /** Vibrant Red — primary / brand */
  primary: '#FF1744',
  /** Red → Pink, the primary gradient */
  gradientFrom: '#FF1744',
  gradientTo: '#FF4D8D',
  /** Electric Blue — secondary */
  secondary: '#2563EB',
  /** Accents */
  purple: '#7C3AED',
  orange: '#FF9F1C',
  green: '#22C55E',
  /** Deep Navy — text / dark */
  navy: '#172554',
  /** Soft White — background */
  surface: '#FAFAFA',
} as const;

export const BRAND_GRADIENT = `linear-gradient(135deg, ${BRAND_COLORS.gradientFrom} 0%, ${BRAND_COLORS.gradientTo} 100%)`;

/** Logo assets, all derived from the two source files in /public/assets. */
export const LOGO = {
  /** Icon mark only — square, transparent. */
  icon: '/assets/logo-256.webp',
  iconSmall: '/assets/logo-128.webp',
  iconPng: '/assets/logo-128.png',
  /** Full horizontal lockup (mark + wordmark). */
  full: '/assets/logo-full-480.webp',
  fullLarge: '/assets/logo-full-720.webp',
  fullPng: '/assets/logo-full-480.png',
} as const;
