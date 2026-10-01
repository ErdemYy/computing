// Fails the build when data/assets.ts points to a file that does not exist.
import fs from 'node:fs'
import path from 'node:path'

const src = fs.readFileSync('data/assets.ts', 'utf8')
const paths = [...src.matchAll(/path:\s*'([^']+)'/g)].map((m) => m[1])
let missing = 0
for (const p of paths) {
  const file = path.join('public', p)
  if (!fs.existsSync(file)) {
    console.error(`[verify-assets] MISSING  ${p}`)
    missing++
  } else {
    const mb = (fs.statSync(file).size / 1e6).toFixed(2)
    console.log(`[verify-assets] ok       ${p} (${mb} MB)`)
  }
}
if (missing) {
  console.error(`[verify-assets] ${missing} model file(s) missing. The site still renders text fallbacks, but fix the mapping in data/assets.ts.`)
  process.exitCode = 1
}
