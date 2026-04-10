import fs from 'node:fs';
import path from 'node:path';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const certPath = path.resolve(__dirname, '../../certs/cert.pem');
const keyPath = path.resolve(__dirname, '../../certs/key.pem');
const hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);

const serverTarget = hasCerts ? 'https://127.0.0.1:3000' : 'http://127.0.0.1:3000';

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  publicDir: 'public',

  server: {
    port: 5174,
    host: true,
    https: hasCerts
      ? { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) }
      : undefined,
    proxy: {
      '/api': { target: serverTarget, changeOrigin: true, secure: false },
      '/trpc': { target: serverTarget, changeOrigin: true, secure: false },
    },
  },
});
