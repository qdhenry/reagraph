import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  root: 'src/experiments/app',
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      'reagraph': resolve(__dirname, './src')
    }
  },
  build: {
    outDir: '../../../dist-experiments',
    emptyOutDir: true
  },
  worker: {
    format: 'es',
    rollupOptions: {
      output: {
        entryFileNames: '[name].js'
      }
    }
  },
  server: {
    port: 3000,
    headers: {
      'Service-Worker-Allowed': '/'
    }
  },
  optimizeDeps: {
    exclude: ['@cosmos.gl/graph']
  }
});