'use client'

import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Group, Points, ShaderMaterial, Vector3 } from 'three'
import { chapterIndexById } from '@/data/timeline'
import { exp } from '@/lib/experienceState'
import { profileFor } from '@/lib/performance'
import { networkLayer } from '@/lib/stage'
import { PulseLines } from './PulseLines'

const MAC = chapterIndexById('macintosh')
const NET = chapterIndexById('network')
const AI = chapterIndexById('ai')

/**
 * Where the Macintosh screen sits in world space (normalised model units).
 * The pixel grid is laid over it so "screen → pixels" is seamless.
 */
export const MAC_SCREEN = { center: new Vector3(0, 0.333, -0.142), width: 0.172, height: 0.118 }

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uMorph;
  uniform float uPxPerUnit;
  uniform float uPixelSize;
  uniform float uNodeSize;
  attribute vec3 aGrid;
  attribute vec3 aNode;
  attribute float aSeed;
  attribute float aPix;
  varying float vMix;
  varying float vPix;
  varying float vSeed;
  void main() {
    // staggered departure so the screen dissolves into the network instead of moving as one slab
    float delay = aSeed * 0.45;
    float m = smoothstep(delay, delay + 0.55, uMorph);
    m = m * m * (3.0 - 2.0 * m);
    vec3 wob = vec3(
      sin(uTime * 0.4 + aSeed * 31.0),
      cos(uTime * 0.33 + aSeed * 17.0),
      sin(uTime * 0.27 + aSeed * 23.0)) * 0.18 * m;
    vec3 p = mix(aGrid, aNode + wob, m);
    // arc outwards while travelling
    p += normalize(aNode + vec3(0.001)) * sin(m * 3.14159) * 0.9 * (0.4 + aSeed);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float world = mix(uPixelSize, uNodeSize * (0.55 + aSeed * 0.9), m);
    gl_PointSize = min(world * uPxPerUnit / max(-mv.z, 0.05), 34.0);
    gl_Position = projectionMatrix * mv;
    vMix = m;
    vPix = aPix;
    vSeed = aSeed;
  }
`

const fragment = /* glsl */ `
  uniform vec3 uAccent;
  uniform float uPresence;
  varying float vMix;
  varying float vPix;
  varying float vSeed;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float circle = smoothstep(0.5, 0.15, length(c));
    float square = step(abs(c.x), 0.46) * step(abs(c.y), 0.46);
    float shape = mix(square, circle, smoothstep(0.0, 0.5, vMix));
    vec3 pixel = vec3(0.7, 0.92, 0.88) * vPix * 1.05;
    vec3 node = uAccent * (1.2 + vSeed * 1.2);
    vec3 col = mix(pixel, node, smoothstep(0.1, 0.8, vMix));
    gl_FragColor = vec4(col, shape * uPresence * mix(max(vPix, 0.05), 1.0, vMix));
  }
`

/** A tiny "Finder-like" bitmap that the pixel grid displays before dissolving. */
function makePixelPattern(cols: number, rows: number): Float32Array {
  const out = new Float32Array(cols * rows).fill(0.1)
  if (typeof document === 'undefined') return out.fill(0.6)
  const cv = document.createElement('canvas')
  cv.width = cols
  cv.height = rows
  const g = cv.getContext('2d')
  if (!g) return out.fill(0.6)
  g.fillStyle = '#d8dee4'
  g.fillRect(0, 0, cols, rows)
  g.fillStyle = '#10141a'
  // menu bar
  g.fillRect(0, 0, cols, 2)
  // window frame + title stripes
  g.fillRect(Math.floor(cols * 0.14), Math.floor(rows * 0.22), Math.floor(cols * 0.72), 1)
  g.fillRect(Math.floor(cols * 0.14), Math.floor(rows * 0.78), Math.floor(cols * 0.72), 1)
  g.fillRect(Math.floor(cols * 0.14), Math.floor(rows * 0.22), 1, Math.floor(rows * 0.56))
  g.fillRect(Math.floor(cols * 0.86), Math.floor(rows * 0.22), 1, Math.floor(rows * 0.56))
  for (let y = Math.floor(rows * 0.26); y < Math.floor(rows * 0.34); y += 2) g.fillRect(Math.floor(cols * 0.18), y, Math.floor(cols * 0.64), 1)
  // smiling icon
  const cx = Math.floor(cols * 0.5)
  const cy = Math.floor(rows * 0.56)
  g.fillRect(cx - 4, cy - 4, 8, 1)
  g.fillRect(cx - 4, cy + 4, 8, 1)
  g.fillRect(cx - 4, cy - 4, 1, 9)
  g.fillRect(cx + 3, cy - 4, 1, 9)
  g.fillRect(cx - 2, cy - 2, 1, 2)
  g.fillRect(cx + 1, cy - 2, 1, 2)
  g.fillRect(cx - 2, cy + 1, 4, 1)
  const data = g.getImageData(0, 0, cols, rows).data
  for (let i = 0; i < cols * rows; i++) out[i] = Math.max(0.06, data[i * 4] / 255)
  return out
}

/** Pseudo random but deterministic so server/client trees stay stable. */
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function gauss(r: () => number) {
  return (r() + r() + r() + r() - 2) * 1.2
}

interface Built {
  geometry: BufferGeometry
  material: ShaderMaterial
  edges: { positions: Float32Array; t: Float32Array; seed: Float32Array }
}

function buildNetwork(total: number): Built {
  const cols = Math.round(Math.sqrt(total * 1.38))
  const rows = Math.max(4, Math.round(total / cols))
  const n = cols * rows
  const r = rng(1984)
  const pix = makePixelPattern(cols, rows)

  const grid = new Float32Array(n * 3)
  const node = new Float32Array(n * 3)
  const seed = new Float32Array(n)
  const aPix = new Float32Array(n)

  const cellW = MAC_SCREEN.width / cols
  const cellH = MAC_SCREEN.height / rows
  const centers: Vector3[] = []
  for (let i = 0; i < 16; i++) {
    const v = new Vector3(r() - 0.5, (r() - 0.5) * 0.7, r() - 0.5).normalize().multiplyScalar(2.2 + r() * 4.8)
    centers.push(v)
  }
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x
      grid[i * 3] = MAC_SCREEN.center.x + (x - (cols - 1) / 2) * cellW
      grid[i * 3 + 1] = MAC_SCREEN.center.y - (y - (rows - 1) / 2) * cellH
      grid[i * 3 + 2] = MAC_SCREEN.center.z
      const c = centers[Math.floor(r() * centers.length)]
      const spread = r() < 0.18 ? 3.2 : 0.95
      node[i * 3] = c.x + gauss(r) * spread
      node[i * 3 + 1] = c.y + gauss(r) * spread * 0.8
      node[i * 3 + 2] = c.z + gauss(r) * spread
      seed[i] = r()
      aPix[i] = pix[i]
    }
  }

  // edges: link each node to its nearest neighbours
  const segs: number[] = []
  const ts: number[] = []
  const ss: number[] = []
  const K = 2
  const maxD2 = 2.6 * 2.6
  for (let i = 0; i < n; i++) {
    const best: [number, number][] = []
    for (let j = 0; j < n; j += 1) {
      if (j === i) continue
      const dx = node[i * 3] - node[j * 3]
      const dy = node[i * 3 + 1] - node[j * 3 + 1]
      const dz = node[i * 3 + 2] - node[j * 3 + 2]
      const d2 = dx * dx + dy * dy + dz * dz
      if (d2 > maxD2) continue
      if (best.length < K) {
        best.push([d2, j])
        best.sort((a, b) => a[0] - b[0])
      } else if (d2 < best[K - 1][0]) {
        best[K - 1] = [d2, j]
        best.sort((a, b) => a[0] - b[0])
      }
    }
    for (const [, j] of best) {
      if (j < i && r() < 0.5) continue
      const s = r()
      segs.push(node[i * 3], node[i * 3 + 1], node[i * 3 + 2], node[j * 3], node[j * 3 + 1], node[j * 3 + 2])
      ts.push(0, 1)
      ss.push(s, s)
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(grid.slice(), 3))
  geometry.setAttribute('aGrid', new BufferAttribute(grid, 3))
  geometry.setAttribute('aNode', new BufferAttribute(node, 3))
  geometry.setAttribute('aSeed', new BufferAttribute(seed, 1))
  geometry.setAttribute('aPix', new BufferAttribute(aPix, 1))

  const material = new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uPxPerUnit: { value: 800 },
      uPixelSize: { value: Math.max(cellW, cellH) * 0.94 },
      uNodeSize: { value: 0.07 },
      uAccent: { value: new Color('#aef2ff') },
      uPresence: { value: 0 },
    },
  })

  return {
    geometry,
    material,
    edges: { positions: new Float32Array(segs), t: new Float32Array(ts), seed: new Float32Array(ss) },
  }
}

/**
 * Macintosh screen → pixels → network nodes → data flows.
 * One point cloud morphs from a pixel grid (placed over the Mac screen) into a connected 3D network.
 */
export function NetworkScene() {
  const group = useRef<Group>(null)
  const points = useRef<Points>(null)
  const dpr = useThree((s) => s.viewport.dpr)
  const size = useThree((s) => s.size)
  const total = profileFor(exp.tier).networkNodes
  const built = useMemo(() => buildNetwork(total), [total])

  useFrame(({ clock }) => {
    const g = group.current
    const p = points.current
    if (!g || !p) return
    const L = networkLayer(MAC, NET, AI)
    const visible = L.presence > 0.01
    if (g.visible !== visible) g.visible = visible
    if (!visible) return
    const u = built.material.uniforms
    u.uTime.value = clock.elapsedTime
    u.uMorph.value = L.morph
    u.uPresence.value = L.presence
    u.uPxPerUnit.value = (size.height * dpr) / (2 * Math.tan((exp.live.fov * Math.PI) / 360))
    ;(u.uAccent.value as Color).copy(exp.live.accent).lerp(new Color('#aef2ff'), 0.4)
    // the whole network slowly turns once it exists (the pixel grid must stay glued to the screen)
    g.rotation.y = exp.reduced ? 0 : L.morph * clock.elapsedTime * 0.035
  })

  return (
    <group ref={group} visible={false}>
      <points ref={points} geometry={built.geometry} material={built.material} frustumCulled={false} />
      <PulseLines
        positions={built.edges.positions}
        t={built.edges.t}
        seed={built.edges.seed}
        color="accent"
        speed={0.45}
        freq={1}
        base={0.07}
        pulse={0.8}
        bloom={1.3}
        presence={() => networkLayer(MAC, NET, AI).edges}
      />
    </group>
  )
}
