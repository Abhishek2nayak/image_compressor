/** @type {import('next').NextConfig} */

// Keep in sync with src/lib/site.ts. next.config.js cannot import TS.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mypdfhub.mythosh.com').replace(
  /\/$/,
  '',
);
const CANONICAL_HOST = new URL(SITE_URL).host;

// Any other hostname pointed at this deployment. Each one 301s (308) to the
// canonical host with the path preserved, so link equity consolidates on one
// domain instead of being split across several.
const LEGACY_HOSTS = [
  'easypdfstudio.app',
  'www.easypdfstudio.app',
  'imagepress.app',
  'www.imagepress.app',
];

const nextConfig = {
  transpilePackages: ['@image-compressor/shared'],
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'lh3.googleusercontent.com' }],
  },
  webpack: (config) => {
    // pdfjs-dist tries to import the Node.js 'canvas' package for server-side
    // rendering; tell webpack to stub it out so the browser bundle works.
    config.resolve.alias.canvas = false;
    return config;
  },
  async redirects() {
    return [
      // Host canonicalisation. Only fires when the request host is NOT the
      // canonical one, so there is no redirect loop.
      ...LEGACY_HOSTS.filter((host) => host !== CANONICAL_HOST).map((host) => ({
        source: '/:path*',
        has: [{ type: 'host', value: host }],
        destination: `${SITE_URL}/:path*`,
        permanent: true,
      })),
      // /docs was never written. Permanent so Google drops it from the index
      // rather than re-crawling a temporary redirect forever.
      { source: '/docs', destination: '/', permanent: true },
    ];
  },
};

module.exports = nextConfig;
