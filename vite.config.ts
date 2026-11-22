import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
// Продакшен собирается под GitHub Pages (сайт stayacid.github.io/train-queue/),
// поэтому base — путь проекта. В dev остаётся корень.
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/train-queue/' : '/',
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}))
