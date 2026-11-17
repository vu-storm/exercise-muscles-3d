import { defineConfig } from 'vite';

export default defineConfig({
  // main.js dùng top-level await khi tải mô hình
  build: { target: 'es2022' },
  esbuild: { target: 'es2022' },
  optimizeDeps: { esbuildOptions: { target: 'es2022' } },
});
