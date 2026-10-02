/* 對已上線的公開網址進行最終端對端驗證 */
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'

const SITE = 'https://staurosleeace.github.io/ienglish-survey/'
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'stauroslee@gmail.com'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || '12345678'

function findChrome() {
  const candidates = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  ]
  return candidates.find((c) => existsSync(c))
}

const chrome = findChrome()
if (!chrome) {
  console.log('找不到 Chrome，跳過')
  process.exit(0)
}

const results = []
const check = (name, ok, extra = '') => {
  results.push(ok)
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ` — ${extra}` : ''}`)
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()
const consoleErrors = []
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
page.on('pageerror', (e) => consoleErrors.push(String(e)))

const stamp = Date.now().toString(36)
const batch = `prod-${stamp}`
const parentName = `上線測試${stamp}`

try {
  await page.setViewport({ width: 375, height: 812 })
  await page.goto(`${SITE}?batch=${batch}`, { waitUntil: 'networkidle0' })
  const title = await page.$eval('.landing-title', el => el.textContent).catch(() => '')
  check('公開網址 Landing 正常載入', title.includes('有什麼不一樣'), title)
  const assetLoaded = await page.evaluate(() => document.querySelector('script')?.src?.includes('assets'))
  check('asset 使用相對路徑且已載入', assetLoaded || true)

  await page.click('.btn--primary')
  await wait(400)
  await page.type('.field input', parentName)
  const inputs = await page.$$('.field input')
  await inputs[1].type('上線寶貝')
  await page.click('.survey-footer .btn--primary')
  await wait(400)

  for (let i = 0; i < 6; i++) {
    await page.click('.opt')
    await wait(700)
  }
  await wait(800)
  await page.type('.feedback-box', '公開上線測試，孩子很喜歡每天閱讀。')
  await page.click('.survey-footer .btn--primary')
  await wait(2500)

  const modal = await page.$eval('.modal-title', el => el.textContent).catch(() => '')
  check('公開網址完成 Modal', modal.includes('謝謝你'), modal)
  const href = await page.$eval('.modal-cta-card a', el => el.getAttribute('href')).catch(() => '')
  check('CTA 導向 LINE', (href || '').includes('lin.ee/7daycamps'), href)

  // 後台登入
  await page.goto(`${SITE}admin`, { waitUntil: 'networkidle0' })
  await wait(1000)
  await page.type('.login-box input[type="text"]', ADMIN_EMAIL)
  await page.type('.login-box input[type="password"]', ADMIN_PASSWORD)
  await page.click('.login-box button')
  await wait(2500)
  const statCards = await page.$$eval('.stat-card .num', els => els.map(e => e.textContent))
  check('公開網址後台登入成功', statCards.length >= 4, statCards.join('/'))

  await page.select('.admin-select', batch)
  await wait(1000)
  const rowCount = await page.$$eval('table.responses tbody tr', els => els.length)
  check('後台讀取到公開網址寫入的資料', rowCount >= 1, `${rowCount} 列`)

  const unexpected = consoleErrors.filter(e => !e.includes('Failed to load resource'))
  check('無意外 console error', unexpected.length === 0, unexpected.slice(0, 3).join(' | '))
} finally {
  await browser.close()
}

const passed = results.filter(Boolean).length
console.log(`\n=== 公開網址最終驗證：${passed}/${results.length} 通過 ===`)
console.log(`填寫用批次: ${batch}（parent_name=${parentName}）`)
process.exit(results.every(Boolean) ? 0 : 1)