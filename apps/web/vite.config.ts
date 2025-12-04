import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import devtoolsJson from 'vite-plugin-devtools-json';
export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths(), devtoolsJson()],
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
