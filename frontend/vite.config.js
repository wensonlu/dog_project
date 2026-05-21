import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vercel/SPA 部署需要根路径资源引用，避免线上 js/css 404 导致白屏
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: true, // ✅ 开启 source map，方便排查错误
    minify: 'esbuild', // 使用 esbuild 更快的构建
  },
  // 仅从根目录 index.html 发现依赖，避免扫描 Capacitor 同步到 ios/android 的构建产物
  optimizeDeps: {
    entries: ['index.html', '!**/ios/**', '!**/android/**'],
  },
  server: {
    watch: {
      ignored: ['**/ios/**', '**/android/**'],
    },
  },
})
