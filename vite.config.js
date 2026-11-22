import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon-32x32.png', 'apple-touch-icon.png', 'offline.html'],
      manifest: {
        name: 'Guia Econômico',
        short_name: 'GuiaEco',
        description: 'Controle financeiro pessoal com insights avançados',
        theme_color: '#820ad1',
        background_color: '#060f1a',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === self.location.origin,
            handler: 'CacheFirst',
            options: { cacheName: 'static-assets', expiration: { maxEntries: 200, maxAgeSeconds: 2592000 } }
          },
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/api/') &&
              !url.hostname.includes('firestore.googleapis.com') &&
              !url.hostname.includes('identitytoolkit.googleapis.com'),
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', networkTimeoutSeconds: 10 }
          }
        ],
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/insights/, /^\/metas/]
      },
      devOptions: { enabled: false }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/')) {
            return 'vendor-react';
          }
          if (id.includes('firebase') || id.includes('@firebase')) {
            return 'vendor-firebase';
          }
          if (
            id.includes('chart.js') ||
            id.includes('react-chartjs-2') ||
            id.includes('chartjs-plugin-datalabels') ||
            id.includes('recharts') ||
            id.includes('d3-') ||
            id.includes('victory-')
          ) {
            return 'vendor-charts';
          }
          if (id.includes('styled-components') || id.includes('react-icons') || id.includes('date-fns')) {
            return 'vendor-ui';
          }
        }
      }
    }
  }
});
