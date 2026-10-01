import fs from 'node:fs'
import path from 'node:path'
const dir = process.argv[2] ?? 'public/models'
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.glb'))) {
  const b = fs.readFileSync(path.join(dir, f))
  const len = b.readUInt32LE(12)
  const j = JSON.parse(b.slice(20, 20 + len).toString('utf8'))
  let tris = 0, verts = 0
  const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]
  for (const m of j.meshes ?? []) for (const p of m.primitives) {
    const a = j.accessors[p.attributes.POSITION]; verts += a.count
    tris += p.indices !== undefined ? j.accessors[p.indices].count / 3 : a.count / 3
  }
  console.log(f, (b.length / 1e6).toFixed(1) + 'MB', 'tris', Math.round(tris), 'verts', verts, 'meshes', j.meshes?.length, 'nodes', j.nodes?.length, 'imgs', j.images?.length, 'mats', j.materials?.length, 'ext', (j.extensionsUsed ?? []).join(','))
}
