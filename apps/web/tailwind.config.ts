import type { Config } from 'tailwindcss';

/**
 * Brand palette (see src/lib/brand.ts for the canonical hex values).
 *
 * `red`, `orange` and `purple` are overridden rather than aliased so the
 * existing utility classes across the app pick up the brand colours without
 * every file having to be rewritten. Three of the brand colours already match
 * Tailwind's defaults exactly and are left alone:
 *   #22C55E = green-500   #2563EB = blue-600   #172554 = blue-950 (Deep Navy)
 */
const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        // ── Brand: Vibrant Red #FF1744 ──────────────────────────────────────
        red: {
          50: '#FFF0F3',
          100: '#FFE1E7',
          200: '#FFC3D0',
          300: '#FF94AC',
          400: '#FF5578',
          500: '#FF1744',
          600: '#ED0036',
          700: '#C8002E',
          800: '#A5012B',
          900: '#8A0729',
          950: '#4D0012',
        },

        // ── Gradient partner: Pink #FF4D8D ──────────────────────────────────
        pink: {
          50: '#FFF1F6',
          100: '#FFE4EE',
          200: '#FFC9DD',
          300: '#FF9FC2',
          400: '#FF4D8D',
          500: '#FF2E79',
          600: '#ED0F5F',
          700: '#C80B4E',
          800: '#A50C43',
          900: '#8A0F3C',
          950: '#4D021C',
        },

        // ── Accent: Orange #FF9F1C ──────────────────────────────────────────
        orange: {
          50: '#FFF8EC',
          100: '#FFEFD1',
          200: '#FFDCA3',
          300: '#FFC46A',
          400: '#FFAE3D',
          500: '#FF9F1C',
          600: '#F08000',
          700: '#C76002',
          800: '#9E4A09',
          900: '#803D0D',
          950: '#451C02',
        },

        // ── Accent: Purple #7C3AED (Tailwind's violet ramp) ─────────────────
        purple: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
          950: '#2E1065',
        },

        // Named tokens for places where intent matters more than a shade number.
        brand: {
          DEFAULT: '#FF1744',
          pink: '#FF4D8D',
          blue: '#2563EB',
          purple: '#7C3AED',
          orange: '#FF9F1C',
          green: '#22C55E',
          navy: '#172554',
          surface: '#FAFAFA',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #FF1744 0%, #FF4D8D 100%)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
