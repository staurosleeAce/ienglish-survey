import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // 相對路徑：讓任一靜態子目錄部署（GitHub Pages / Netlify / Vercel subpath）都能正確載入
  base: './',
  plugins: [react()],
})