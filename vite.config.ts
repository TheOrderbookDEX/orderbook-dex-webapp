import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import eslint from 'vite-plugin-eslint';

export default defineConfig({
  plugins: [ react(), eslint() ],
  base: '/app/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          apexcharts: ['apexcharts'],
          ethers: ['ethers'],
          webapi: ['@theorderbookdex/orderbook-dex-webapi'],
        },
      }
    }
  }
});
