import type { Config } from 'tailwindcss';
import defaultColors from 'tailwindcss/colors';
import plugin from 'tailwindcss/plugin';

/**
 * VYOOOM design tokens.
 *
 * Every colour the app uses is a CSS variable, so light/dark mode is a single
 * class switch on <html>. Components keep writing ordinary classes
 * (`bg-white`, `text-slate-500`, `bg-brand-600`) and get the right value in
 * both themes without `dark:` variants.
 *
 *  - Neutrals ("slate", "gray", "zinc", "stone", "neutral" all point here) are
 *    a warm graphite scale — no blue cast. In dark mode the scale inverts.
 *  - `white` is the surface colour (cards, inputs). In dark mode it becomes the
 *    raised dark surface; `text-white` on accent buttons becomes dark ink,
 *    which keeps contrast high on the lighter dark-mode accent.
 *  - `brand` is "Ember" orange. Blue is deliberately absent from the palette.
 */

type Scale = Record<(typeof SHADES)[number], string>;
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

const NEUTRAL_LIGHT: Scale = {
  50: '#fafaf9', 100: '#f4f3f1', 200: '#e8e6e3', 300: '#d5d2ce', 400: '#7c756f',
  500: '#635c57', 600: '#4d4743', 700: '#3b3633', 800: '#282422', 900: '#1a1715', 950: '#0d0b0a',
};
const NEUTRAL_DARK: Scale = {
  50: '#0f0e0d', 100: '#1f1d1b', 200: '#2e2b28', 300: '#423e3a', 400: '#938c86',
  500: '#aaa39d', 600: '#c3bdb7', 700: '#d8d3ce', 800: '#e9e5e1', 900: '#f5f3f0', 950: '#faf9f7',
};
const SURFACE_LIGHT = '#ffffff';
const SURFACE_DARK = '#181614';

// "Ember" — 600 is the button colour (white text ≥ 4.5:1), 700 is accent text.
const BRAND_LIGHT: Scale = {
  50: '#fff5ef', 100: '#ffe8db', 200: '#fecdb2', 300: '#fdaa7e', 400: '#fb7f45',
  500: '#f25f1c', 600: '#cf440d', 700: '#ad380b', 800: '#8e310f', 900: '#742b10', 950: '#3f1305',
};
const BRAND_DARK: Scale = {
  50: '#2a1a12', 100: '#3a2114', 200: '#5a2e16', 300: '#8a4019', 400: '#e5672a',
  500: '#f47a3e', 600: '#f7894f', 700: '#fba574', 800: '#fdc4a1', 900: '#fee0cd', 950: '#fff3ea',
};

// Status colours keep Tailwind's light values and get a generated dark variant.
const STATUS = ['red', 'green', 'emerald', 'amber', 'yellow', 'orange', 'purple', 'violet', 'rose'] as const;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}
const channels = (hex: string) => hexToRgb(hex).join(' ');
function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a); const [br, bg, bb] = hexToRgb(b);
  const m = (x: number, y: number) => Math.round(x * t + y * (1 - t)).toString(16).padStart(2, '0');
  return `#${m(ar, br)}${m(ag, bg)}${m(ab, bb)}`;
}
/** Dark-mode version of a light scale: tints become deep washes, darks become lights. */
function darkStatus(s: Scale): Scale {
  return {
    50: mix(s[500], SURFACE_DARK, 0.12), 100: mix(s[500], SURFACE_DARK, 0.2), 200: mix(s[500], SURFACE_DARK, 0.32),
    300: mix(s[500], SURFACE_DARK, 0.5), 400: s[500], 500: s[400], 600: s[400], 700: s[300], 800: s[200],
    900: s[100], 950: s[50],
  };
}

function vars(prefix: string, scale: Scale) {
  return Object.fromEntries(SHADES.map(k => [`--${prefix}-${k}`, channels(scale[k])]));
}
function scaleRef(prefix: string) {
  return Object.fromEntries(SHADES.map(k => [k, `rgb(var(--${prefix}-${k}) / <alpha-value>)`]));
}

const lightVars: Record<string, string> = {
  ...vars('n', NEUTRAL_LIGHT), ...vars('brand', BRAND_LIGHT), '--surface': channels(SURFACE_LIGHT),
};
const darkVars: Record<string, string> = {
  ...vars('n', NEUTRAL_DARK), ...vars('brand', BRAND_DARK), '--surface': channels(SURFACE_DARK),
};
const statusColors: Record<string, Record<number, string>> = {};
for (const name of STATUS) {
  const light = (defaultColors as unknown as Record<string, Scale>)[name];
  Object.assign(lightVars, vars(name, light));
  Object.assign(darkVars, vars(name, darkStatus(light)));
  statusColors[name] = scaleRef(name);
}

const neutral = scaleRef('n');

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/tools/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        white: 'rgb(var(--surface) / <alpha-value>)',
        slate: neutral, gray: neutral, zinc: neutral, stone: neutral, neutral,
        brand: scaleRef('brand'),
        ...statusColors,
        // shadcn-style aliases still used by a few legacy screens
        border: 'rgb(var(--n-200) / <alpha-value>)',
        input: 'rgb(var(--n-200) / <alpha-value>)',
        ring: 'rgb(var(--brand-500) / <alpha-value>)',
        background: 'rgb(var(--n-50) / <alpha-value>)',
        foreground: 'rgb(var(--n-900) / <alpha-value>)',
        primary: { DEFAULT: 'rgb(var(--brand-600) / <alpha-value>)', foreground: 'rgb(var(--surface) / <alpha-value>)' },
        secondary: { DEFAULT: 'rgb(var(--n-100) / <alpha-value>)', foreground: 'rgb(var(--n-900) / <alpha-value>)' },
        destructive: { DEFAULT: 'rgb(var(--red-600) / <alpha-value>)', foreground: 'rgb(var(--surface) / <alpha-value>)' },
        muted: { DEFAULT: 'rgb(var(--n-100) / <alpha-value>)', foreground: 'rgb(var(--n-500) / <alpha-value>)' },
        accent: { DEFAULT: 'rgb(var(--n-100) / <alpha-value>)', foreground: 'rgb(var(--n-900) / <alpha-value>)' },
        card: { DEFAULT: 'rgb(var(--surface) / <alpha-value>)', foreground: 'rgb(var(--n-900) / <alpha-value>)' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.625rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      boxShadow: {
        dock: '0 1px 0 0 rgb(255 255 255 / 0.04) inset, 0 12px 32px -8px rgb(0 0 0 / 0.25), 0 2px 6px -1px rgb(0 0 0 / 0.12)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'pop-in': { from: { opacity: '0', transform: 'translateY(6px) scale(0.98)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: {
        'fade-in': 'fade-in 120ms ease-out',
        'pop-in': 'pop-in 160ms cubic-bezier(0.2, 0.9, 0.3, 1)',
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root': { ...lightVars, 'color-scheme': 'light' },
        '.dark': { ...darkVars, 'color-scheme': 'dark' },
      });
    }),
  ],
};

export default config;
