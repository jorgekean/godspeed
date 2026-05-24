import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['godspeed.png', 'icons.svg', 'opencv.js', 'omr.worker.js'],
      manifest: {
        name: 'Godspeed Grader',
        short_name: 'Godspeed',
        description: 'Grade bubble sheet exams instantly with your phone camera',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/godspeed.png',
            sizes: 'any',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/godspeed.png',
            sizes: 'any',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        categories: ['education', 'productivity'],
        screenshots: [
          {
            src: '/social-preview.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
          },
        ],
      },
      workbox: {
        // ADD THIS LINE: Increase the cache limit to 15 MB (15 * 1024 * 1024)
        maximumFileSizeToCacheInBytes: 15728640,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'godspeed-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: /https:\/\/docs\.opencv\.org\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'opencv-cache',
              expiration: {
                maxAgeSeconds: 60 * 24 * 60 * 60,
              },
            },
          },
        ],
      },
    }),
  ],
  base: '/',
  server: {
    host: true,
    allowedHosts: true,
  },
})