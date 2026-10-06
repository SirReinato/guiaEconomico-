import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Guia Econômico',
        short_name: 'GuiaEco',
        description: 'Controle financeiro pessoal com insights avançados',
        theme_color: '#0d6efd',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
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
            urlPattern: ({ url }) => url.origin.includes('firebase') || url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', networkTimeoutSeconds: 10 }
          }
        ],
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/insights/]
      },
      devOptions: { enabled: true }
    })
  ]
});
