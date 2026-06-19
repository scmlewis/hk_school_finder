import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['mask-icon.svg'],
      manifest: {
        name: 'HK School Finder',
        short_name: 'HKSchools',
        description: 'Hong Kong School Map & Commute Finder',
        theme_color: '#ffffff',
        icons: []
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('maplibre-gl')) return 'vendor-maplibre';
            return 'vendor';
          }
        }
      }
    }
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
