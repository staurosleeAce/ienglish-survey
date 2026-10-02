import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'

const SITE = 'https://staurosleeace.github.io/ienglish-survey/'
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((c) => existsSync(c))
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()
page.on('console', (m) => console.log('[console]', m.type(), m.text()))
page.on('pageerror', (e) => console.log('[pageerror]', String(e)))

await page.goto(`${SITE}admin`, { waitUntil: 'networkidle0' })
await wait(1500)
console.log('URL:', page.url())
const body = await page.evaluate(() => document.body.innerText.slice(0, 200))
console.log('BODY:', JSON.stringify(body))
const inputs = await page.$$('.login-box input')
console.log('login inputs:', inputs.length)
await browser.close()
process.exit(0)