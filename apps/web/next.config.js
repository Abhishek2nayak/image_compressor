/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@image-compressor/shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  // Pricing and docs are temporarily hidden — redirect to home
  async redirects() {
    return [
      { source: '/pricing', destination: '/', permanent: false },
      { source: '/docs',    destination: '/', permanent: false },
    ];
  },
};

module.exports = nextConfig;
