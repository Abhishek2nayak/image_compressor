import type { MetadataRoute } from 'next';

/** Lets phones "Add to Home Screen" with the hummingbird icon and brand colours. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VYOOOM — Free Online Tools',
    short_name: 'VYOOOM',
    description: 'Free PDF, image, social and everyday tools that run in your browser. Nothing is uploaded.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafaf9',
    theme_color: '#cf440d',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
