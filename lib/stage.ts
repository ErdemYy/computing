import { Color, MathUtils, Vector3 } from 'three'
import { TIMELINE, type CameraKey, type TransitionType } from '@/data/timeline'
import { exp, LAST_CHAPTER } from './experienceState'

const { clamp, lerp, damp } = MathUtils

export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}
export const expoOut = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))
export const expoIn = (t: number) => (t <= 0 ? 0 : Math.pow(2, 10 * (t - 1)))

const colors = new Map<string, Color>()
const hex = (h: string) => {
  let c = colors.get(h)
  if (!c) {
    c = new Color(h)
    colors.set(h, c)
  }
  return c
}

// ───────────────────────────── camera sampling ─────────────────────────────

interface Pose {
  az: number
  el: number
  dist: number
  tx: number
  ty: number
  tz: number
  shift: number
  fov: number
}

const flatKey = (k: CameraKey): Pose => ({
  az: k.az,
  el: k.el,
  dist: k.dist,
  tx: k.target[0],
  ty: k.target[1],
  tz: k.target[2],
  shift: k.shift ?? 0,
  fov: k.fov ?? 32,
})

const FIELDS: (keyof Pose)[] = ['az', 'el', 'dist', 'tx', 'ty', 'tz', 'shift', 'fov']
const flatCache: Pose[][] = TIMELINE.map((c) => c.camera.map(flatKey))

const hermite = (p0: number, p1: number, m0: number, m1: number, t: number) => {
  const t2 = t * t
  const t3 = t2 * t
  return (2 * t3 - 3 * t2 + 1) * p0 + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * p1 + (t3 - t2) * m1
}

/** Catmull-Rom style interpolation through a chapter's camera keys. */
function samplePose(chapter: number, t: number, out: Pose) {
  const keys = TIMELINE[chapter].camera
  const flat = flatCache[chapter]
  const n = keys.length
  if (t <= keys[0].t) return Object.assign(out, flat[0])
  if (t >= keys[n - 1].t) return Object.assign(out, flat[n - 1])
  let i = 0
  while (i < n - 2 && t > keys[i + 1].t) i++
  const t0 = keys[i].t
  const t1 = keys[i + 1].t
  const span = t1 - t0
  const u = (t - t0) / span
  for (const f of FIELDS) {
    const p0 = flat[i][f]
    const p1 = flat[i + 1][f]
    const prev = i > 0 ? flat[i - 1][f] : p0
    const next = i + 2 < n ? flat[i + 2][f] : p1
    const tPrev = i > 0 ? keys[i - 1].t : t0 - span
    const tNext = i + 2 < n ? keys[i + 2].t : t1 + span
    const m0 = ((p1 - prev) / (t1 - tPrev)) * span * (i > 0 ? 1 : 0.5)
    const m1 = ((next - p0) / (tNext - t0)) * span * (i + 2 < n ? 1 : 0.5)
    out[f] = hermite(p0, p1, m0, m1, u)
  }
  return out
}

const poseA: Pose = { az: 0, el: 0, dist: 8, tx: 0, ty: 0, tz: 0, shift: 0, fov: 32 }
const poseB: Pose = { ...poseA }
const poseOut: Pose = { ...poseA }

// ───────────────────────────── transition curves ─────────────────────────────

interface Curve {
  out: (b: number) => number
  inn: (b: number) => number
}

const CURVES: Record<TransitionType, Curve> = {
  dissolve: { out: (b) => 1 - smoothstep(0, 0.7, b), inn: (b) => smoothstep(0.3, 1, b) },
  shrink: { out: (b) => 1 - smoothstep(0.3, 0.58, b), inn: (b) => smoothstep(0.55, 0.8, b) },
  screen: { out: (b) => 1 - smoothstep(0.32, 0.62, b), inn: (b) => smoothstep(0.5, 1, b) },
  flow: { out: (b) => 1 - smoothstep(0.2, 0.8, b), inn: (b) => smoothstep(0.35, 1, b) },
}

export interface ModelEffect {
  opacity: number
  scale: number
  y: number
}

const effect: ModelEffect = { opacity: 0, scale: 1, y: 0 }

/**
 * How present a chapter's *model* is right now and how it should be scaled.
 * Reads the per-frame director state, so call it from useFrame after the director ran.
 */
export function modelEffect(index: number): ModelEffect {
  const { c, next, b, type } = exp.live
  effect.opacity = 0
  effect.scale = 1
  effect.y = 0
  if (index === c) {
    if (type === 'none' || b === 0) {
      effect.opacity = 1
      return effect
    }
    const o = CURVES[type as TransitionType].out(b)
    effect.opacity = o
    if (type === 'shrink') {
      const s = smoothstep(0, 0.58, b)
      effect.scale = lerp(1, 0.035, Math.pow(s, 1.35))
    } else if (type === 'dissolve') {
      effect.scale = 1 + 0.07 * (1 - o)
    }
  } else if (index === next && type !== 'none') {
    const i = CURVES[type as TransitionType].inn(b)
    effect.opacity = i
    if (type === 'shrink') {
      effect.scale = 0.18 + 0.82 * expoOut(i)
    } else {
      effect.scale = 0.9 + 0.1 * i
      effect.y = (1 - i) * -0.15
    }
  }
  return effect
}

/** 0..1 presence for non-model layers owned by `index` (particles, circuits, grid, crt…). */
export function layerPresence(index: number): number {
  return modelEffect(index).opacity
}

/** Visual state of the pixel / network layer (see NetworkScene). */
export interface NetworkLayer {
  /** overall visibility of the point layer */
  presence: number
  /** 0 = pixel grid on the Macintosh screen … 1 = scattered network nodes */
  morph: number
  /** edge / data-flow visibility */
  edges: number
}
const netLayer: NetworkLayer = { presence: 0, morph: 0, edges: 0 }

export function networkLayer(macIndex: number, netIndex: number, aiIndex: number): NetworkLayer {
  const { c, b } = exp.live
  netLayer.presence = 0
  netLayer.morph = 1
  netLayer.edges = 0
  if (c === macIndex) {
    netLayer.presence = smoothstep(0.1, 0.38, b)
    netLayer.morph = smoothstep(0.42, 1, b)
    netLayer.edges = smoothstep(0.7, 1, b)
  } else if (c === netIndex) {
    netLayer.presence = 1
    netLayer.edges = 1
  } else if (c === aiIndex) {
    netLayer.presence = 0.35
    netLayer.edges = 0.45
  }
  if (c === netIndex && exp.live.type === 'flow') {
    netLayer.presence = lerp(1, 0.35, smoothstep(0.3, 1, b))
    netLayer.edges = lerp(1, 0.45, smoothstep(0.3, 1, b))
  }
  return netLayer
}

// ───────────────────────────── the director ─────────────────────────────

export interface DirectorInput {
  dt: number
  aspect: number
  parallax: boolean
}

const tmpDir = new Vector3()
let first = true

/**
 * Computes camera, theme and lighting for the current scroll position.
 * Runs once per frame (before everything else) and writes into `exp.live`.
 */
export function directStage({ dt, aspect, parallax }: DirectorInput) {
  const L = exp.live
  const c = clamp(exp.chapter, 0, LAST_CHAPTER)
  const t = clamp(exp.local, 0, 1)
  const ch = TIMELINE[c]
  const tr = ch.transition
  const nextIdx = Math.min(c + 1, LAST_CHAPTER)
  const next = TIMELINE[nextIdx]
  const b = tr && c < LAST_CHAPTER ? clamp((t - (1 - tr.zone)) / tr.zone, 0, 1) : 0

  L.c = c
  L.next = nextIdx
  L.b = b
  L.type = tr && b > 0 ? tr.type : 'none'

  // — camera pose —
  samplePose(c, t, poseA)
  if (exp.reduced) {
    const k0 = flatCache[c][0]
    poseA.az = k0.az + (poseA.az - k0.az) * 0.3
    poseA.el = k0.el + (poseA.el - k0.el) * 0.3
    poseA.dist = k0.dist + (poseA.dist - k0.dist) * 0.45
    poseA.tx = k0.tx + (poseA.tx - k0.tx) * 0.4
    poseA.ty = k0.ty + (poseA.ty - k0.ty) * 0.4
    poseA.tz = k0.tz + (poseA.tz - k0.tz) * 0.25
  }
  Object.assign(poseOut, poseA)

  if (b > 0 && tr) {
    samplePose(nextIdx, 0, poseB)
    switch (tr.type) {
      case 'shrink': {
        // pull back while the machine collapses, cut in the dark, then dive onto the chip
        if (b < 0.5) {
          const u = smoothstep(0, 1, b * 2)
          Object.assign(poseOut, poseA)
          poseOut.dist = poseA.dist * (1 + 2.2 * u)
        } else {
          const u = (b - 0.5) * 2
          Object.assign(poseOut, poseB)
          poseOut.dist = poseB.dist * (1 + 7 * (1 - expoOut(u)))
          poseOut.az = poseB.az + (1 - expoOut(u)) * 0.9
        }
        break
      }
      case 'screen': {
        const u = smoothstep(0.32, 1, b)
        for (const f of FIELDS) poseOut[f] = lerp(poseA[f], poseB[f], u)
        break
      }
      case 'flow': {
        const u = smoothstep(0, 1, b)
        for (const f of FIELDS) poseOut[f] = lerp(poseA[f], poseB[f], u)
        break
      }
      default: {
        const u = smoothstep(0, 1, b)
        for (const f of FIELDS) poseOut[f] = lerp(poseA[f], poseB[f], u)
        // breathe back a little so the swap reads as a dolly, not a cut
        poseOut.dist *= 1 + 0.32 * Math.sin(Math.PI * u)
      }
    }
  }

  // portrait / small screens: pull back so models fit, lift the frame above the text
  const portrait = aspect < 1.1
  const fit = aspect < 1.5 ? Math.pow(1.5 / aspect, 0.78) : 1
  let dist = poseOut.dist * fit
  let az = poseOut.az
  let el = poseOut.el
  if (parallax && !exp.reduced) {
    az += exp.mouse.x * 0.045
    el += exp.mouse.y * 0.022
  }
  const cosEl = Math.cos(el)
  tmpDir.set(Math.sin(az) * cosEl, Math.sin(el), Math.cos(az) * cosEl).multiplyScalar(dist)
  const tx = poseOut.tx
  const ty = poseOut.ty - (portrait ? dist * 0.1 : 0)
  const tz = poseOut.tz
  const lam = first ? 1000 : 12
  L.camTarget.x = damp(L.camTarget.x, tx, lam, dt)
  L.camTarget.y = damp(L.camTarget.y, ty, lam, dt)
  L.camTarget.z = damp(L.camTarget.z, tz, lam, dt)
  L.camPos.x = damp(L.camPos.x, tx + tmpDir.x, lam, dt)
  L.camPos.y = damp(L.camPos.y, ty + tmpDir.y, lam, dt)
  L.camPos.z = damp(L.camPos.z, tz + tmpDir.z, lam, dt)
  L.fov = damp(L.fov, poseOut.fov + (portrait ? 6 : 0), lam, dt)
  L.shiftX = damp(L.shiftX, portrait ? 0 : poseOut.shift, lam, dt)
  first = false

  // — theme, fog, lights —
  let tb = smoothstep(0, 1, b)
  let dark = 0
  if (tr && b > 0) {
    switch (tr.type) {
      case 'shrink':
        tb = smoothstep(0.42, 0.62, b)
        dark = smoothstep(0.05, 0.4, b) - smoothstep(0.55, 0.85, b)
        break
      case 'dissolve':
        dark = 0.4 * Math.sin(Math.PI * b)
        break
      case 'flow':
        dark = 0.25 * Math.sin(Math.PI * b)
        break
      case 'screen':
        dark = 0.15 * Math.sin(Math.PI * b)
        break
    }
  }
  L.darkness = dark
  const k = 1 - dark * 0.93

  L.bg.copy(hex(ch.theme.bg)).lerp(hex(next.theme.bg), tb)
  L.accent.copy(hex(ch.theme.accent)).lerp(hex(next.theme.accent), tb)
  L.fog = lerp(ch.theme.fog, next.theme.fog, tb)
  L.envIntensity = 1.05 * lerp(ch.theme.env ?? 1, next.theme.env ?? 1, tb) * k

  const A = ch.theme.light
  const B = next.theme.light
  L.ambientColor.copy(hex(A.ambient[0])).lerp(hex(B.ambient[0]), tb)
  L.ambient = lerp(A.ambient[1], B.ambient[1], tb) * k
  L.keyColor.copy(hex(A.key[0])).lerp(hex(B.key[0]), tb)
  L.key = lerp(A.key[1], B.key[1], tb) * k
  L.keyPos.set(...A.key[2]).lerp(tmpDir.set(...B.key[2]), tb)
  L.rimColor.copy(hex(A.rim[0])).lerp(hex(B.rim[0]), tb)
  L.rim = lerp(A.rim[1], B.rim[1], tb) * k
  L.rimPos.set(...A.rim[2]).lerp(tmpDir.set(...B.rim[2]), tb)
  L.fillColor.copy(hex(A.fill[0])).lerp(hex(B.fill[0]), tb)
  L.fill = lerp(A.fill[1], B.fill[1], tb) * k
  L.fillPos.set(...A.fill[2]).lerp(tmpDir.set(...B.fill[2]), tb)
}
