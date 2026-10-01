import type { Tier } from './experienceState'

export interface PerfProfile {
  tier: Tier
  /** device pixel ratio clamp [min, max] */
  dpr: [number, number]
  /** multiplier for particle counts */
  particles: number
  postprocessing: boolean
  smaa: boolean
  noise: boolean
  /** mouse parallax allowed */
  parallax: boolean
  /** number of network nodes */
  networkNodes: number
  /** racks per side in the data-centre aisle */
  racks: number
}

const PROFILES: Record<Tier, PerfProfile> = {
  high: { tier: 'high', dpr: [1, 1.75], particles: 1, postprocessing: true, smaa: true, noise: true, parallax: true, networkNodes: 900, racks: 18 },
  medium: { tier: 'medium', dpr: [1, 1.4], particles: 0.6, postprocessing: true, smaa: false, noise: false, parallax: true, networkNodes: 600, racks: 13 },
  low: { tier: 'low', dpr: [1, 1.15], particles: 0.3, postprocessing: false, smaa: false, noise: false, parallax: false, networkNodes: 320, racks: 8 },
}

/** Picks a quality tier from viewport, pointer type and hardware hints. Client only. */
export function detectTier(): Tier {
  if (typeof window === 'undefined') return 'high'
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const narrow = window.innerWidth < 820
  const nav = navigator as Navigator & { deviceMemory?: number }
  const cores = nav.hardwareConcurrency ?? 4
  const mem = nav.deviceMemory ?? 8
  if (coarse || narrow) return cores <= 4 || mem <= 3 ? 'low' : 'medium'
  if (cores <= 4 || mem <= 4) return 'medium'
  return 'high'
}

export const profileFor = (tier: Tier): PerfProfile => PROFILES[tier]

/** Downgrade one step (used by the runtime FPS monitor). */
export const lowerTier = (tier: Tier): Tier => (tier === 'high' ? 'medium' : 'low')
