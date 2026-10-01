// Re-creates the optimised GLBs in public/models from the untouched originals in assets-source/.
// Uses meshopt geometry compression, mesh joining/instancing and 1024px WebP textures.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const src = 'assets-source'
const out = 'public/models'
fs.mkdirSync(out, { recursive: true })
for (const f of fs.readdirSync(src).filter((f) => f.endsWith('.glb'))) {
  console.log('optimising', f)
  execFileSync(
    'npx',
    ['gltf-transform', 'optimize', path.join(src, f), path.join(out, f), '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', '1024', '--simplify', 'false'],
    { stdio: 'inherit', shell: true },
  )
}
