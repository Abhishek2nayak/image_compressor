/** @type {import('next').NextConfig} */
const nextConfig = {
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
      { source: '/docs', destination: '/', permanent: false },
    ];
  },
};

module.exports = nextConfig;
