import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { getBounds } from '@gltf-transform/functions'
const file = process.argv[2]
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const doc = await io.read(file)
const scene = doc.getRoot().listScenes()[0]
const total = getBounds(scene)
const f = (v) => v.map((n) => n.toFixed(3)).join(', ')
console.log('TOTAL min', f(total.min), 'max', f(total.max))
const rows = []
scene.traverse((n) => {
  if (!n.getMesh()) return
  const b = getBounds(n)
  const size = b.max.map((m, i) => m - b.min[i])
  rows.push({ name: n.getName(), mesh: n.getMesh().getName(), min: b.min, max: b.max, vol: size[0] * size[1] * size[2] })
})
rows.sort((a, b) => b.vol - a.vol)
for (const r of rows.slice(0, +(process.argv[3] ?? 25))) console.log(r.name.padEnd(34), 'min', f(r.min), '| max', f(r.max))
