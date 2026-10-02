// Post-build: 複製 dist/index.html 成 dist/404.html
// GitHub Pages 對未知路徑（例如 /admin）會回傳 404.html 並保留 URL，
// 讓 React Router 能接手渲染後台頁面（SPA fallback）。
import { copyFileSync, existsSync } from 'node:fs'

const src = new URL('../dist/index.html', import.meta.url)
const dest = new URL('../dist/404.html', import.meta.url)

if (!existsSync(src)) {
  console.error('[postbuild] dist/index.html 不存在，跳過 404 fallback 複製。')
} else {
  copyFileSync(src, dest)
  console.log('[postbuild] dist/404.html 已建立（SPA fallback）。')
}