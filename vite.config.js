import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
  plugins: [preact()],
  assetsInclude: ['**/*.glb', '**/*.mkv'],
  esbuild: {
    drop: ['console', 'debugger'], // Strip debug console statements in production builds
    legalComments: 'none',
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: true,
    cssMinify: true,
    assetsInlineLimit: 4096, // Inline small assets under 4KB to save HTTP requests
    modulePreload: {
      polyfill: false, // Save bundle overhead by disabling unused modulepreload polyfill
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three')) {
              return 'vendor-three'
            }
            if (id.includes('lenis')) {
              return 'vendor-lenis'
            }
            if (id.includes('@sanity') || id.includes('@portabletext')) {
              return 'vendor-sanity'
            }
            if (id.includes('preact')) {
              return 'vendor-preact'
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
})
