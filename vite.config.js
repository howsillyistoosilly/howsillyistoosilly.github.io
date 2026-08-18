import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
            if (id.includes('@react-three')) {
              return 'vendor-r3f'
            }
            if (id.includes('lenis')) {
              return 'vendor-lenis'
            }
            if (id.includes('@sanity') || id.includes('@portabletext')) {
              return 'vendor-sanity'
            }
            if (id.includes('react')) {
              return 'vendor-react'
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
})
