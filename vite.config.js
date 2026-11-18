import { defineConfig } from 'vite';

export default defineConfig({
  // Đường dẫn tương đối: chạy được cả ở gốc tên miền lẫn thư mục con
  // (GitHub Pages: https://vu-storm.github.io/exercise-muscles-3d/).
  base: './',
  // main.js dùng top-level await khi tải mô hình
  build: { target: 'es2022' },
  esbuild: { target: 'es2022' },
  optimizeDeps: { esbuildOptions: { target: 'es2022' } },
});
