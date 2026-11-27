# VYOOOM

Free everyday tools that run entirely in the browser — PDF, image, social, AI helpers, text tools and calculators. Files never leave the visitor's device.

Live at **[vyooom.com](https://vyooom.com)**.

## Tech stack

| Layer | Technology |
|-------|-----------|
| App | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS with CSS-variable design tokens (automatic dark mode) |
| PDF | pdf-lib, pdf.js, jsPDF |
| Everything else | Web APIs: Canvas, MediaRecorder, Web Share, DecompressionStream |

There is no server-side processing. Every tool must work client-side.

## Project structure

```
apps/
  web/                    # the VYOOOM site
    src/lib/tools.ts      # tool registry: drives home page, sitemap, SEO, routing
    src/tools/            # one component per tool, code-split by slug
    src/components/       # site shell (dock, ⌘K palette), shared tool UI
    src/app/[slug]/       # every tool page is generated from the registry
    src/app/_disabled/    # parked pages that need the old backend
  api/                    # legacy backend (not used by the site)
packages/
  shared/                 # shared TypeScript types
```

## Run it

Requires Node.js ≥ 20 and pnpm ≥ 9.

```bash
pnpm install
pnpm --filter web dev       # http://localhost:3000
pnpm --filter web build     # production build
```

## Adding a tool

1. Add an entry to `ALL_TOOLS` in `apps/web/src/lib/tools.ts` (slug, name, description, keywords, FAQs).
2. Create the component in `apps/web/src/tools/<category>/`.
3. Register it in `apps/web/src/tools/index.ts`.

The page, metadata, structured data and sitemap entry are generated automatically. Set `hidden: true` to switch a tool off without deleting it.

## Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console token for vyooom.com (optional) |

## Brand

- Name: **VYOOOM** (all caps). Mark: the Ember hummingbird whose raised wings form the V.
- Accent: Ember orange `#CF440D`, on warm graphite neutrals. No blue.
- Logo files: `apps/web/public/brand/`.
