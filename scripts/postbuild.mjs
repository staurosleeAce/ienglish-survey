// Post-build: 複製 dist/index.html 成 dist/404.html
// GitHub Pages 對未知路徑（例如 /admin）會回傳 404.html 並保留 URL，
// 讓 React Router 能接手渲染後台頁面（SPA fallback）。
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'

const src = new URL('../dist/index.html', import.meta.url)
const dest = new URL('../dist/404.html', import.meta.url)
const superDest = new URL('../dist/super.html', import.meta.url)

if (!existsSync(src)) {
  console.error('[postbuild] dist/index.html 不存在，跳過 404 fallback 複製。')
} else {
  copyFileSync(src, dest)
  console.log('[postbuild] dist/404.html 已建立（SPA fallback）。')

  // GitHub Pages / LINE WebView 會先讀取靜態 HTML 的 title，
  // Super 專案需要獨立入口，避免初始 title 沿用 7 日營。
  const indexHtml = readFileSync(src, 'utf8')
  const superHtml = indexHtml.replace(
    '<title>7 日英語閱讀口說營｜小 i 陪你回顧</title>',
    '<title>平凡爸媽很 Super｜7 天陪伴・第 1 期</title>',
  )
  writeFileSync(superDest, superHtml, 'utf8')
  console.log('[postbuild] dist/super.html 已建立（Super 專案獨立 title）。')
}
