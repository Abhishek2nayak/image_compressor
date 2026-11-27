/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets a verification build run beside `next dev` without sharing .next
  distDir: process.env.NEXT_DIST_DIR || '.next',
  transpilePackages: ['@image-compressor/shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  webpack: (config) => {
    // pdfjs-dist tries to import the Node.js 'canvas' package for server-side
    // rendering; tell webpack to stub it out so the browser bundle works.
    config.resolve.alias.canvas = false;
    return config;
  },
  async redirects() {
    return [
      // Temporarily hidden while there is no backend (code kept in src/app/_disabled
      // and behind `hidden: true` in src/lib/tools.ts). Remove a line to bring it back.
      ...['/compress-pdf', '/remove-background', '/docs', '/pricing', '/login', '/register', '/dashboard', '/api-keys', '/compress']
        .map(source => ({ source, destination: '/', permanent: false })),
      // Registered but not built yet (hidden in src/lib/tools.ts). Remove a slug once its tool ships.
      ...['organize-pdf', 'add-page-numbers', 'sign-pdf', 'redact-pdf', 'compress-image-to-kb', 'exam-photo-resizer', 'passport-photo-maker', 'social-media-image-resizer', 'image-color-palette', 'meme-generator', 'blur-image', 'heic-to-jpg', 'image-to-text', 'income-tax-calculator', 'salary-calculator', 'cgpa-to-percentage', 'attendance-calculator', 'pomodoro-timer', 'time-zone-converter', 'invoice-generator', 'screen-recorder', 'voice-recorder']
        .map(slug => ({ source: `/${slug}`, destination: '/', permanent: false })),
      // QR codes live on our dedicated site; keep old links and rankings working.
      { source: '/qr-code', destination: 'https://freeqrgenerator.mythosh.com/', permanent: true },
    ];
  },
};

module.exports = nextConfig;
