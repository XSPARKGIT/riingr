import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isCordova = process.env.CORDOVA_BUILD === 'true';

export default defineConfig({
  base: isCordova ? './' : '/',
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || ''),
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || ''),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: isCordova ? {
    // For Cordova: build in legacy mode (no ES modules)
    target: 'es2015',
    rollupOptions: {
      output: {
        format: 'iife',
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  } : {}
});
