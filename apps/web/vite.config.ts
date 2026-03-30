import fs from 'node:fs';
import path from 'node:path';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import devtoolsJson from 'vite-plugin-devtools-json';

const certPath = path.resolve(__dirname, '../../certs/cert.pem');
const keyPath = path.resolve(__dirname, '../../certs/key.pem');
const hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);

const serverTarget = hasCerts ? 'https://localhost:3000' : 'http://localhost:3000';

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), devtoolsJson()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  publicDir: 'public',

  server: {
    host: true,
    https: hasCerts
      ? { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) }
      : undefined,
    proxy: {
      '/reference': {
        target: serverTarget,
        changeOrigin: true,
        rewrite: p => p.replace(/^\/reference/, '/reference'),
        secure: false,
      },
      '/openapi.json': {
        target: serverTarget,
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: serverTarget,
        changeOrigin: true,
        secure: false,
      },
      '/js': { target: serverTarget, changeOrigin: true, secure: false },
      '/css': { target: serverTarget, changeOrigin: true, secure: false },
      '/scalar': { target: serverTarget, changeOrigin: true, secure: false },
      '/trpc': { target: serverTarget, changeOrigin: true, secure: false },
      '/favicon.ico': { target: serverTarget, changeOrigin: true, secure: false },
    },
  },
});
