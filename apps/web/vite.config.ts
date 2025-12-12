import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import path from 'path';

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), devtoolsJson()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  publicDir: 'public',

  server: {
    proxy: {
      '/docs': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/docs/, '/reference'),
        secure: true,
      },
      '/openapi.json': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/js': { target: 'http://localhost:3000', changeOrigin: true },
      '/css': { target: 'http://localhost:3000', changeOrigin: true },
      '/scalar': { target: 'http://localhost:3000', changeOrigin: true },
      '/favicon.ico': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
});
