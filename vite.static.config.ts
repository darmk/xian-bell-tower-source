import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Nginx mounts the contents of dist at /xianBellTower/.
export default defineConfig({
  base: '/xianBellTower/',
  cacheDir: 'node_modules/.vite-static',
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  build: { outDir: 'dist', emptyOutDir: true },
  preview: { host: '127.0.0.1', port: 3000, strictPort: true },
});
