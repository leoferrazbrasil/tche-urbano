import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import AstroPWA from '@vite-pwa/astro';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://www.tcheurbano.com.br',
  integrations: [
    tailwind(),
    AstroPWA({
      mode: 'production',
      base: '/',
      scope: '/',
      includeAssets: ['favicon.ico', 'assets/img/*'],
      manifest: {
        name: 'Tchê Urbano | Clube VIP',
        short_name: 'Tchê Urbano',
        description: 'Descontos exclusivos e experiências gastronômicas no RS e SC',
        theme_color: '#821512',
        background_color: '#FAF6F1',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/assets/img/logo-tche-urbano.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/assets/img/logo-tche-urbano.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
