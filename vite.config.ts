import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import eslint from 'vite-plugin-eslint';

export default defineConfig({
  plugins: [ react(), eslint() ],
  base: '/app/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@theorderbookdex')) return '@theorderbookdex';
            if (id.includes('@ethersproject')) return '@ethersproject';
            if (id.includes('apexcharts')) return 'apexcharts';
            return 'vendor';
          }
        }
      }
    }
  }
});
