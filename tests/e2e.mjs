/* eslint-disable no-console */
/**
 * 端對端冒煙測試（E2E）— 正式 Supabase 環境
 *
 * 依賴環境變數（請在 shell 設定後再執行）：
 *   E2E_SUPABASE_URL           Supabase Project URL
 *   E2E_SUPABASE_PUBLISHABLE_KEY    publishable key（anon）
 *   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD  後台管理員帳號
 *
 * 流程：家長填寫問卷 → Submit（寫入 Supabase） → 後台登入 → 讀取到這筆資料
 *
 * 執行：
 *   npm run build
 *   node tests/e2e.mjs
 */
import puppeteer from 'puppeteer-core'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'

const BASE = 'http://localhost:4173'

const ENV = {
  url: process.env.E2E_SUPABASE_URL || '',
  publishableKey:
    process.env.E2E_SUPABASE_PUBLISHABLE_KEY || process.env.E2E_SUPABASE_ANON_KEY || '',
  adminEmail: process.env.E2E_ADMIN_EMAIL || '',
  adminPassword: process.env.E2E_ADMIN_PASSWORD || '',
  lineUrl: process.env.E2E_LINE_URL || 'https://lin.ee/dXPhchf',
}

const SKIP = !(ENV.url && ENV.publishableKey && ENV.adminEmail && ENV.adminPassword)

function findChrome() {
  const candidates = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
  ]
  return candidates.find((c) => existsSync(c))
}

let preview
async function isServerUp() {
  try {
    const res = await fetch(`${BASE}/`, { method: 'GET' })
    return res.ok || res.status === 200
  } catch {
    return false
  }
}
function startPreview() {
  preview = spawn('npm.cmd', ['run', 'preview', '--', '--port', '4173', '--strictPort'], {
    cwd: process.cwd(),
    stdio: 'ignore',
    detached: true,
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      VITE_SUPABASE_URL: ENV.url,
      VITE_SUPABASE_PUBLISHABLE_KEY: ENV.publishableKey,
      VITE_LINE_OFFICIAL_URL: ENV.lineUrl,
    },
  })
  return new Promise((res) => {
    const startedAt = Date.now()
    const poll = async () => {
      if (await isServerUp()) return res(true)
      if (Date.now() - startedAt > 25000) return res(false)
      setTimeout(poll, 500)
    }
    poll()
  })
}
async function stopPreview() {
  if (preview) {
    try {
      process.kill(-preview.pid)
    } catch {
      /* ignore */
    }
    preview = null
  }
}

const results = []
function check(name, ok, extra = '') {
  results.push({ name, ok })
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ` — ${extra}` : ''}`)
}
function wait(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  if (SKIP) {
    console.log('⏭️  缺少 E2E 環境變數（E2E_SUPABASE_URL / PUBLISHABLE_KEY / 管理員帳號），跳過。')
    console.log('   請依 README 設定後再執行 node tests/e2e.mjs')
    process.exit(0)
  }

  const chromePath = findChrome()
  if (!chromePath) {
    console.log('⚠️  找不到 Chrome/Edge，跳過 E2E。')
    process.exit(0)
  }

  // 使用隨機的 batch 與識別名稱，方便驗證與清理
  // 注意：不能包含防 spam 關鍵字（測試/test/spam/http…），否則會被正當擋下
  const stamp = Date.now().toString(36)
  const batch = `camp-${stamp}`
  const parentName = `家長${stamp}`
  const childName = `寶貝${stamp}`
  const feedbackText = '孩子七天下來每天都主動拿起小i，進步很多，想了解正式方案。'

  await startPreview()
  if (!(await isServerUp())) {
    console.log('❌ Preview server 無法啟動，中止 E2E。')
    process.exit(1)
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
  const page = await browser.newPage()
  const [consoleErrors, debugLog] = [[], []]
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
    if (msg.text().includes('submitted id')) debugLog.push(msg.text())
  })
  page.on('pageerror', (err) => consoleErrors.push(String(err)))
  // 記錄所有對 Supabase 的回應失敗（區分「預期錯誤密碼」與「真實異常」）
  const failedRequests = []
  page.on('response', (res) => {
    if (res.status() >= 400 && res.url().includes('fqadjocrgsxbaztmyknc')) {
      failedRequests.push(`${res.status()} ${new URL(res.url()).pathname}`)
    }
  })
  page.on('requestfailed', (req) => {
    if (req.url().includes('fqadjocrgsxbaztmyknc')) {
      failedRequests.push(`REQFAIL ${new URL(req.url()).pathname}`)
    }
  })

  try {
    // ---------- 1. Mobile viewport ----------
    await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 1 })
    await page.goto(`${BASE}/?batch=${batch}&src=e2e`, { waitUntil: 'networkidle0' })
    const hasHScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    check('手機 375px 無橫向捲動', !hasHScroll)

    const title = await page.$eval('.landing-title', (el) => el.textContent)
    check('Landing 開場顯示標題', (title ?? '').includes('有什麼不一樣'), title)

    // ---------- 2. 身份 ----------
    await page.click('.btn--primary')
    await wait(400)
    await page.click('.survey-footer .btn--primary')
    await wait(300)
    const errOnEmpty = await page.$('.banner--err')
    check('缺少必填欄位時顯示錯誤', !!errOnEmpty)

    await page.type('.field input', parentName)
    const inputs = await page.$$('.field input')
    await inputs[1].type(childName)
    await page.click('.survey-footer .btn--primary')
    await wait(400)

    // ---------- 3. Q1..Q6 ----------
    for (let i = 0; i < 6; i++) {
      const stepLabel = await page.$eval('.progress-meta .step', (el) => el.textContent)
      check(`第 ${i + 1} 題進度顯示`, (stepLabel ?? '').includes(`${i + 1} / 6`), stepLabel)
      await page.click('.opt')
      await wait(700)
    }
    await wait(800)

    // ---------- 4. 回饋 + 送出 ----------
    const hasFeedback = await page.$('.feedback-box')
    check('到達回饋步驟', !!hasFeedback)
    if (hasFeedback) {
      await page.type('.feedback-box', feedbackText)
      await page.click('.survey-footer .btn--primary')
      await wait(2500)
    }

    const modalTitle = await page.$eval('.modal-title', (el) => el.textContent).catch(() => '')
    check('完成 Modal 顯示', (modalTitle ?? '').includes('謝謝你'), modalTitle)

    const cta = await page
      .$eval('.modal-cta-card .btn', (el) => el.textContent)
      .catch(() => '')
    check('依 Q4 顯示動態 CTA', (cta ?? '').includes('正式使用方式'), cta)

    const lineHref = await page
      .$eval('.modal-cta-card a', (el) => el.getAttribute('href'))
      .catch(() => '')
    // CTA 應使用 VITE_LINE_OFFICIAL_URL（E2E_LINE_URL）
    check('CTA 導向環境變數設定的 LINE', (lineHref ?? '').includes(ENV.lineUrl.split('/').pop()), lineHref)

    // ---------- 5. 後台登入並讀取 ----------
    await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle0' })
    await wait(700)

    // 錯誤密碼
    await page.type('.login-box input[type="text"]', ENV.adminEmail)
    await page.type('.login-box input[type="password"]', 'wrong-password')
    await page.click('.login-box button')
    await wait(1200)
    const badLogin = await page.$('.banner--err')
    check('後台錯誤密碼被拒絕', !!badLogin)

    // 正確登入
    await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle0' })
    await wait(700)
    await page.type('.login-box input[type="text"]', ENV.adminEmail)
    await page.type('.login-box input[type="password"]', ENV.adminPassword)
    await page.click('.login-box button')
    await wait(2000)

    const statCards = await page.$$eval('.stat-card .num', (els) => els.map((e) => e.textContent))
    check('後台 Dashboard 統計出現（讀取正式 DB）', statCards.length >= 4, statCards.join('/'))

    // 依批次篩選到 E2E 寫入的資料
    await page.select('.admin-select', batch)
    await wait(800)
    const hasRow = await page.$$eval('table.responses tbody tr', (els) => els.length)
    check('後台看到 E2E 寫入的問卷列', hasRow >= 1, `${hasRow} 列`)

    await page.type('.admin-search', parentName)
    await wait(600)
    const searchHits = await page.$$eval('table.responses tbody tr', (els) =>
      els.map((el) => el.textContent?.trim()),
    )
    check('搜尋到 E2E 家長', searchHits.some((t) => (t ?? '').includes(parentName)))

    // 單筆檢視
    await page.click('table.responses tbody tr')
    await wait(600)
    const drawer = await page.$('.drawer')
    check('單筆完整資料檢視', !!drawer)

    // ---------- 6. Console 錯誤檢查 ----------
    // 排除「預期」的錯誤密碼登入測試（auth 400）與其瀏覽器 console 記錄
    const unexpected = [
      ...consoleErrors.filter((e) => !e.includes('Failed to load resource') && !e.includes('/auth/v1/')),
      ...failedRequests.filter((f) => !f.includes('/auth/v1/')),
    ]
    console.log(`  (Supabase 失敗請求: ${failedRequests.join(' | ') || '無'})`)
    console.log(`  (console error: ${consoleErrors.join(' | ') || '無'})`)
    check(
      '無意外 console error / 意外 API 失敗',
      unexpected.length === 0,
      unexpected.slice(0, 5).join(' | '),
    )

    console.log(`\n📝 E2E 寫入批次: ${batch}（parent_name=${parentName}）`)
  } finally {
    await browser.close()
    await stopPreview()
  }

  const failed = results.filter((r) => !r.ok)
  console.log(`\n=== E2E 結果：${results.length - failed.length}/${results.length} 通過 ===`)
  if (failed.length > 0) {
    failed.forEach((f) => console.log('  ❌', f.name))
    process.exit(1)
  }
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  stopPreview().finally(() => process.exit(1))
})