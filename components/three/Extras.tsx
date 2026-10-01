'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Color, Group, Mesh, ShaderMaterial } from 'three'
import { chapterIndexById } from '@/data/timeline'
import { exp } from '@/lib/experienceState'
import { profileFor } from '@/lib/performance'
import { layerPresence } from '@/lib/stage'
import { PulseLines } from './PulseLines'

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

// ───────────────────────────── Intel 4004 circuit traces ─────────────────────────────

const INTEL = chapterIndexById('intel4004')

function buildCircuits() {
  const r = rng(4004)
  const segs: number[] = []
  const ts: number[] = []
  const ss: number[] = []
  const TRACES = 46
  for (let k = 0; k < TRACES; k++) {
    const ang = (k / TRACES) * Math.PI * 2 + (r() - 0.5) * 0.12
    // snap the first run to an axis so traces read as PCB routing
    let dx = Math.abs(Math.cos(ang)) > Math.abs(Math.sin(ang)) ? Math.sign(Math.cos(ang)) : 0
    let dz = dx === 0 ? Math.sign(Math.sin(ang)) : 0
    let x = Math.cos(ang) * 1.45
    let z = Math.sin(ang) * 1.45
    let dist = 0
    const seed = r()
    const runs = 3 + Math.floor(r() * 3)
    for (let s = 0; s < runs; s++) {
      const len = 0.5 + r() * 1.5
      const nx = x + dx * len
      const nz = z + dz * len
      segs.push(x, 0, z, nx, 0, nz)
      ts.push(dist, dist + len)
      ss.push(seed, seed)
      dist += len
      x = nx
      z = nz
      // turn 45° or 90°
      if (r() < 0.5) {
        const nxd = dx === 0 ? (r() < 0.5 ? 1 : -1) : dx
        const nzd = dz === 0 ? (r() < 0.5 ? 1 : -1) : dz
        dx = dx === 0 ? nxd : dx * 0.7071
        dz = dz === 0 ? nzd : dz * 0.7071
        if (Math.abs(dx) > 0.01 && Math.abs(dz) > 0.01) {
          dx *= 1.4142
          dz *= 1.4142
        }
      } else {
        const t = dx
        dx = -dz * (r() < 0.5 ? 1 : -1)
        dz = t * (dx === 0 ? 1 : 1)
      }
      const m = Math.hypot(dx, dz) || 1
      dx /= m
      dz /= m
    }
  }
  return { positions: new Float32Array(segs), t: new Float32Array(ts), seed: new Float32Array(ss) }
}

/** Glowing circuit traces radiating from the 4004, with electric pulses running outwards. */
export function CircuitTraces() {
  const data = useMemo(buildCircuits, [])
  const group = useRef<Group>(null)
  // sit on the board plane right under the chip once the model has loaded
  useFrame(() => {
    if (group.current) group.current.position.y = floorOf(INTEL) - 0.01
  })
  return (
    <group ref={group}>
    <PulseLines
      positions={data.positions}
      t={data.t}
      seed={data.seed}
      color="#3fd8ff"
      speed={0.55}
      freq={0.55}
      base={0.1}
      pulse={0.9}
      bloom={1.2}
      presence={() => layerPresence(INTEL)}
    />
    </group>
  )
}

const floorOf = (chapter: number) => exp.floors[chapter] ?? -0.55

// ───────────────────────────── grid floor ─────────────────────────────

const gridVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`
const gridFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uCell;
  uniform float uRadius;
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vec2 g = vWorld.xz / uCell;
    vec2 d = abs(fract(g - 0.5) - 0.5) / fwidth(g);
    float line = 1.0 - min(min(d.x, d.y), 1.0);
    float major = 1.0 - min(min(abs(fract(g / 5.0 - 0.5) - 0.5).x / fwidth(g / 5.0).x, abs(fract(g / 5.0 - 0.5) - 0.5).y / fwidth(g / 5.0).y), 1.0);
    float fade = 1.0 - smoothstep(uRadius * 0.15, uRadius, length(vWorld.xz - cameraPosition.xz * 0.0));
    gl_FragColor = vec4(uColor * (0.55 + major * 0.9), (line * 0.35 + major * 0.35) * fade * uOpacity);
  }
`

/** Faint architectural grid under a chapter's model. */
export function GridFloor({ chapterIndex, cell = 0.6, radius = 14 }: { chapterIndex: number; cell?: number; radius?: number }) {
  const mesh = useRef<Mesh>(null)
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: gridVertex,
        fragmentShader: gridFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        extensions: { derivatives: true } as never,
        uniforms: {
          uColor: { value: new Color('#ffffff') },
          uOpacity: { value: 0 },
          uCell: { value: cell },
          uRadius: { value: radius },
        },
      }),
    [cell, radius],
  )

  useFrame(() => {
    const m = mesh.current
    if (!m) return
    const p = layerPresence(chapterIndex)
    const visible = p > 0.01
    if (m.visible !== visible) m.visible = visible
    if (!visible) return
    material.uniforms.uOpacity.value = p * 0.8
    ;(material.uniforms.uColor.value as Color).copy(exp.live.accent)
    m.position.y = floorOf(chapterIndex) - 0.002
  })

  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} visible={false} frustumCulled={false}>
      <planeGeometry args={[radius * 2, radius * 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

// ───────────────────────────── data-centre streams ─────────────────────────────

const AI = chapterIndexById('ai')

function buildStreams(count: number) {
  const r = rng(2026)
  const segs: number[] = []
  const ts: number[] = []
  const ss: number[] = []
  const STEP = 36
  for (let k = 0; k < count; k++) {
    const x0 = (r() - 0.5) * 4.4
    const y0 = 0.2 + r() * 3
    const phase = r() * 6.28
    const amp = 0.1 + r() * 0.5
    const seed = r()
    const z0 = 7
    const z1 = -17
    for (let i = 0; i < STEP; i++) {
      const a = i / STEP
      const b = (i + 1) / STEP
      const p = (u: number) => [x0 + Math.sin(u * 5 + phase) * amp, y0 + Math.cos(u * 4 + phase) * amp * 0.7, z0 + (z1 - z0) * u]
      const A = p(a)
      const B = p(b)
      segs.push(A[0], A[1], A[2], B[0], B[1], B[2])
      ts.push(a, b)
      ss.push(seed, seed)
    }
  }
  return { positions: new Float32Array(segs), t: new Float32Array(ts), seed: new Float32Array(ss) }
}

/** Light streams running down the aisle — the "network layer" merging with the data centre. */
export function DataStreams() {
  const count = Math.round(34 * profileFor(exp.tier).particles + 8)
  const data = useMemo(() => buildStreams(count), [count])
  return (
    <PulseLines
      positions={data.positions}
      t={data.t}
      seed={data.seed}
      color="accent"
      speed={0.9}
      freq={2.2}
      base={0.04}
      pulse={0.95}
      bloom={1.6}
      presence={() => {
        const l = exp.live
        if (l.c === AI) return 1
        if (l.next === AI && l.b > 0) return Math.max(0, (l.b - 0.35) / 0.65)
        return 0
      }}
    />
  )
}
