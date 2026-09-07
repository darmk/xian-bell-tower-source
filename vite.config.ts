import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The Nginx site is mounted at https://darmk.com.cn/xianBellTower/.
export default defineConfig({
  base: '/xianBellTower/',
  cacheDir: 'node_modules/.vite',
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  build: { outDir: 'dist', emptyOutDir: true },
  server: { host: '0.0.0.0', port: 3000, strictPort: true },
  preview: { host: '127.0.0.1', port: 3000, strictPort: true },
});
