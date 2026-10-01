// Visual QA helper: scrolls to chapter positions and saves screenshots (headless Chromium + SwiftShader).
// usage: node scripts/shoot.mjs [--w 1440 --h 900] [--url http://localhost:3100] [--out shots] chapter:t chapter:t ...
import { chromium } from 'playwright'
import fs from 'node:fs'

const args = process.argv.slice(2)
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args.splice(i, 2)[1] : def
}
const W = +opt('w', 1440)
const H = +opt('h', 900)
const URL = opt('url', 'http://localhost:3100')
const OUT = opt('out', 'shots')
const WAIT = +opt('wait', 1800)
const reduced = opt('reduced', '0') === '1'
const mobile = opt('mobile', '0') === '1'
const blockModel = opt('block', '')
const targets = args.length ? args : ['hero:0']

fs.mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--use-gl=angle'],
})
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, reducedMotion: reduced ? 'reduce' : 'no-preference', isMobile: mobile, hasTouch: mobile })
const page = await ctx.newPage()
if (blockModel) await page.route(`**/models/${blockModel}`, (r) => r.fulfill({ status: 404, body: 'not found' }))
const logs = []
page.on('console', (m) => {
  if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text().slice(0, 300)}`)
})
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message.slice(0, 300)}`))
page.on('requestfailed', (r) => logs.push(`[requestfailed] ${r.url()}`))

await page.goto(URL, { waitUntil: 'load' })
const t0 = Date.now()
await page.waitForSelector('.loading-screen', { state: 'detached', timeout: 90000 }).catch(() => logs.push('[timeout] loading screen did not leave'))
console.log('loading finished in', Date.now() - t0, 'ms')
await page.waitForTimeout(2500)

for (const t of targets) {
  const [id, local = '0'] = t.split(':')
  const y = await page.evaluate(
    ([id, local]) => {
      if (id === 'about') return document.getElementById('about').offsetTop
      if (id === 'credits') return document.getElementById('credits').offsetTop
      if (id === 'footer') return document.documentElement.scrollHeight
      const el = document.querySelector(`[data-section="${id}"]`)
      return el.offsetTop + el.offsetHeight * parseFloat(local)
    },
    [id, local],
  )
  await page.evaluate((y) => window.scrollTo(0, y), y)
  await page.waitForTimeout(WAIT)
  const file = `${OUT}/${id}-${local}-${W}x${H}${mobile ? '-m' : ''}${reduced ? '-rm' : ''}${blockModel ? '-blocked' : ''}.png`
  await page.screenshot({ path: file, timeout: 120000 })
  console.log('saved', file)
}

const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
console.log('horizontal overflow px:', overflow)
console.log(logs.length ? logs.join('\n') : 'no console errors / warnings')
await browser.close()
