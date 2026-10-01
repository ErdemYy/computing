import { ASSETS, type AssetId } from './assets'

export type V3 = [number, number, number]

export type ChapterId =
  | 'hero'
  | 'babbage'
  | 'univac'
  | 'mainframe'
  | 'intel4004'
  | 'altair'
  | 'apple2'
  | 'ibmpc'
  | 'macintosh'
  | 'network'
  | 'ai'

export type TransitionType = 'dissolve' | 'shrink' | 'screen' | 'flow'
export type ParticleKind = 'dust' | 'electric' | 'data' | 'dataDense'
export type Extra = 'circuits' | 'grid' | 'network' | 'datacenter' | 'crt'

/** One camera keyframe. `t` is chapter-local progress (0..1). Orbit coordinates around `target`. */
export interface CameraKey {
  t: number
  /** azimuth, radians (0 = looking at the front, +Z) */
  az: number
  /** elevation, radians */
  el: number
  /** distance from target */
  dist: number
  target: V3
  /** horizontal frame offset as a fraction of viewport width (desktop only) */
  shift?: number
  fov?: number
}

export interface LightRig {
  ambient: [string, number]
  key: [string, number, V3]
  rim: [string, number, V3]
  fill: [string, number, V3]
}

export interface ChapterTheme {
  accent: string
  bg: string
  fog: number
  /** environment reflection strength multiplier (default 1) */
  env?: number
  light: LightRig
}

export interface ChapterAnimation {
  /** extra yaw applied to the model across the chapter [from, to] (radians) */
  yaw: [number, number]
  /** model scale multiplier across the chapter */
  scale: [number, number]
  particles?: ParticleKind
  extras?: Extra[]
}

export interface ChapterTransition {
  type: TransitionType
  /** fraction of this chapter's scroll length used to transition into the next one */
  zone: number
}

export interface TimelineChapter {
  id: ChapterId
  /** label used by the timeline indicator */
  label: string
  year: string
  title: string
  subtitle: string
  description: string
  /** asset id (null = no physical model) and its resolved public path */
  asset: AssetId | null
  model: string | null
  theme: ChapterTheme
  camera: CameraKey[]
  animation: ChapterAnimation
  transition?: ChapterTransition
  /** scroll length in viewport heights */
  duration: number
  align: 'left' | 'right' | 'center'
}

const rig = (
  ambient: [string, number],
  key: [string, number, V3],
  rim: [string, number, V3],
  fill: [string, number, V3],
): LightRig => ({ ambient, key, rim, fill })

const model = (id: AssetId | null) => (id ? ASSETS[id].path : null)

export const TIMELINE: TimelineChapter[] = [
  {
    id: 'hero',
    label: 'START',
    year: '1820 → 2026',
    title: 'COMPUTING',
    subtitle: 'BİLGİSAYARIN EVRİMİ',
    description: '',
    asset: null,
    model: null,
    duration: 100,
    align: 'center',
    theme: {
      accent: '#a8a49a',
      bg: '#000000',
      fog: 0.03,
      light: rig(['#222222', 0.2], ['#ffffff', 0, [3, 4, 3]], ['#888888', 0, [-3, 2, -3]], ['#222222', 0, [0, 0, 4]]),
    },
    camera: [
      { t: 0, az: 0.5, el: 0.2, dist: 13, target: [0, 0, 0], shift: 0.1 },
      { t: 1, az: 0.4, el: 0.25, dist: 9, target: [0, 0, 0], shift: 0.1 },
    ],
    animation: { yaw: [0, 0], scale: [1, 1], particles: 'dust' },
    transition: { type: 'dissolve', zone: 0.5 },
  },
  {
    id: 'babbage',
    label: '1820s',
    year: '1820s',
    title: 'MECHANICAL COMPUTATION',
    subtitle: 'Before silicon, there were gears.',
    description:
      'The earliest vision of programmable computation emerged from mechanical systems, precision gears and mathematical calculation.',
    asset: 'babbage',
    model: model('babbage'),
    duration: 500,
    align: 'left',
    theme: {
      accent: '#d08c4e',
      bg: '#0b0704',
      fog: 0.045,
      env: 0.7,
      light: rig(['#4a3320', 0.5], ['#ffc48a', 4.2, [3.5, 4.5, 3]], ['#ff9a4a', 3, [-4, 2.5, -3.5]], ['#6a4326', 0.9, [-3, 0.5, 3]]),
    },
    camera: [
      { t: 0, az: 0.5, el: 0.34, dist: 7.2, target: [0, 0, 0], shift: 0.2 },
      { t: 0.35, az: -0.15, el: 0.42, dist: 5.6, target: [0.3, 0, 0], shift: 0.2 },
      { t: 0.7, az: -0.75, el: 0.22, dist: 3.8, target: [0.6, 0.15, 0], shift: 0.2 },
      { t: 1, az: -0.35, el: 0.4, dist: 6.6, target: [0, 0, 0], shift: 0.2 },
    ],
    animation: { yaw: [0, 0.25], scale: [0.96, 1.04], particles: 'dust' },
    transition: { type: 'dissolve', zone: 0.24 },
  },
  {
    id: 'univac',
    label: '1950s',
    year: '1950s',
    title: 'COMPUTING BECOMES A BUSINESS',
    subtitle: 'Machines leave the laboratory.',
    description:
      'Large-scale computers began moving beyond research environments and into business and institutional computing.',
    asset: 'univac',
    model: model('univac'),
    duration: 450,
    align: 'right',
    theme: {
      accent: '#ffa326',
      bg: '#090705',
      fog: 0.04,
      light: rig(['#2c2118', 0.4], ['#ffd29a', 2.6, [-5, 3, 3]], ['#ff8a1c', 3.4, [5, 1.5, -2]], ['#3b2a1a', 0.8, [0, -1, 5]]),
    },
    camera: [
      { t: 0, az: -0.9, el: 0.12, dist: 11.5, target: [0, 0.1, 0], shift: -0.2 },
      { t: 0.5, az: -0.2, el: 0.06, dist: 9, target: [0, 0.15, 0], shift: -0.2 },
      { t: 1, az: 0.65, el: 0.2, dist: 10, target: [0, 0.1, 0], shift: -0.2 },
    ],
    animation: { yaw: [0, 0], scale: [0.98, 1.03], particles: 'dust' },
    transition: { type: 'dissolve', zone: 0.2 },
  },
  {
    id: 'mainframe',
    label: '1960s',
    year: '1960s',
    title: 'ONE MACHINE.\nA WHOLE ORGANIZATION.',
    subtitle: 'The mainframe era begins.',
    description:
      'Computing becomes centralized, expensive and powerful enough to serve entire organizations.',
    asset: 'mainframe',
    model: model('mainframe'),
    duration: 450,
    align: 'left',
    theme: {
      accent: '#37e08b',
      bg: '#010a05',
      fog: 0.05,
      light: rig(['#0b3a22', 0.7], ['#b8ffd8', 2.2, [4, 6, 4]], ['#27d97a', 2.6, [-5, 2, -4]], ['#0d4f2d', 1, [0, 1, 5]]),
    },
    camera: [
      { t: 0, az: 0.95, el: 0.62, dist: 10.5, target: [0, 0, 0], shift: 0.19 },
      { t: 0.55, az: 0.55, el: 0.42, dist: 9, target: [0, 0, 0], shift: 0.19 },
      { t: 1, az: 0.3, el: 0.3, dist: 9.6, target: [0, 0, 0], shift: 0.19 },
    ],
    animation: { yaw: [0, 0], scale: [1, 1], extras: ['grid'] },
    transition: { type: 'shrink', zone: 0.34 },
  },
  {
    id: 'intel4004',
    label: '1971',
    year: '1971',
    title: 'THE COMPUTER SHRINKS.',
    subtitle: 'The processor becomes the machine.',
    description:
      'The microprocessor transformed the scale of computing by placing processing capability onto a single chip.',
    asset: 'intel4004',
    model: model('intel4004'),
    duration: 500,
    align: 'right',
    theme: {
      accent: '#38d4ff',
      bg: '#010710',
      fog: 0.05,
      light: rig(['#0a2a3c', 0.55], ['#cdefff', 3.2, [2, 4, 3]], ['#34d1ff', 5, [-3, 1, -2.5]], ['#0b3e57', 1, [0, 0, 4]]),
    },
    camera: [
      { t: 0, az: -0.55, el: 0.5, dist: 6.2, target: [0, 0, 0], shift: -0.17 },
      { t: 0.5, az: 0.1, el: 0.62, dist: 4.6, target: [0, 0, 0], shift: -0.17 },
      { t: 1, az: 0.65, el: 0.45, dist: 6.4, target: [0, 0, 0], shift: -0.17 },
    ],
    animation: { yaw: [0, 0.5], scale: [1, 1.08], particles: 'electric', extras: ['circuits'] },
    transition: { type: 'dissolve', zone: 0.2 },
  },
  {
    id: 'altair',
    label: '1975',
    year: '1975',
    title: 'THE COMPUTER LEAVES THE LAB.',
    subtitle: 'Personal computing begins.',
    description:
      'The idea of owning and operating a computer moved closer to individuals and hobbyists.',
    asset: 'altair8800',
    model: model('altair8800'),
    duration: 450,
    align: 'left',
    theme: {
      accent: '#3f78ff',
      bg: '#02050f',
      fog: 0.045,
      light: rig(['#0d1c44', 0.6], ['#cfe0ff', 2.4, [3, 3, 5]], ['#35d3ff', 4, [-4, 1.5, -2]], ['#10265f', 1, [0, 0, 4]]),
    },
    camera: [
      { t: 0, az: 0.6, el: 0.22, dist: 10.2, target: [0, 0, 0], shift: 0.2 },
      { t: 0.55, az: 0.18, el: 0.14, dist: 7.4, target: [0, 0.05, 0], shift: 0.2 },
      { t: 1, az: -0.2, el: 0.2, dist: 8.2, target: [0, 0, 0], shift: 0.2 },
    ],
    animation: { yaw: [0, 0], scale: [1, 1.04], extras: ['crt'] },
    transition: { type: 'dissolve', zone: 0.18 },
  },
  {
    id: 'apple2',
    label: '1977',
    year: '1977',
    title: 'COMPUTING ENTERS THE HOME.',
    subtitle: 'A computer becomes personal.',
    description:
      'Personal computers begin to enter homes, schools and everyday life.',
    asset: 'apple2',
    model: model('apple2'),
    duration: 450,
    align: 'right',
    theme: {
      accent: '#ecd9b2',
      bg: '#120e09',
      fog: 0.035,
      light: rig(['#5a4630', 0.9], ['#ffe8c4', 3, [-3, 4, 4]], ['#ffd9a0', 1.6, [4, 2, -3]], ['#6b5238', 1.1, [0, -0.5, 4]]),
    },
    camera: [
      { t: 0, az: -0.55, el: 0.3, dist: 9.8, target: [0, 0, 0], shift: -0.2 },
      { t: 0.55, az: -0.1, el: 0.28, dist: 7.2, target: [0, 0.05, 0], shift: -0.2 },
      { t: 1, az: 0.35, el: 0.32, dist: 8.2, target: [0, 0, 0], shift: -0.2 },
    ],
    animation: { yaw: [0, 0], scale: [1, 1.03], extras: ['crt'] },
    transition: { type: 'dissolve', zone: 0.18 },
  },
  {
    id: 'ibmpc',
    label: '1981',
    year: '1981',
    title: 'THE PERSONAL COMPUTER\nBECOMES A STANDARD.',
    subtitle: 'Computing takes a new form.',
    description:
      'The personal computer moves from experimentation toward standardization.',
    asset: 'ibmpc',
    model: model('ibmpc'),
    duration: 450,
    align: 'left',
    theme: {
      accent: '#8da6c4',
      bg: '#06090d',
      fog: 0.04,
      light: rig(['#27323f', 0.8], ['#dfe9f5', 2.6, [3, 5, 4]], ['#5f86c4', 2.2, [-4, 2, -3]], ['#2b3a4c', 1, [0, 0, 5]]),
    },
    camera: [
      { t: 0, az: 0.7, el: 0.3, dist: 7.4, target: [0, 0, 0], shift: 0.17 },
      { t: 0.55, az: 0.15, el: 0.24, dist: 5.8, target: [0, 0, 0], shift: 0.17 },
      { t: 1, az: -0.4, el: 0.3, dist: 6.6, target: [0, 0, 0], shift: 0.17 },
    ],
    animation: { yaw: [0, 0], scale: [1, 1.02], extras: ['grid'] },
    transition: { type: 'dissolve', zone: 0.18 },
  },
  {
    id: 'macintosh',
    label: '1984',
    year: '1984',
    title: 'COMPUTERS BECOME VISUAL.',
    subtitle: 'The interface becomes part of the experience.',
    description:
      'Computers become easier to approach through graphical interfaces and visual interaction.',
    asset: 'macintosh128k',
    model: model('macintosh128k'),
    duration: 500,
    align: 'right',
    theme: {
      accent: '#cfd7e0',
      bg: '#101216',
      fog: 0.03,
      light: rig(['#4a5360', 1], ['#ffffff', 3.2, [2, 4, 5]], ['#9bb6d6', 1.8, [-4, 2, -3]], ['#5c6674', 1.2, [0, 0, 5]]),
    },
    camera: [
      { t: 0, az: -0.5, el: 0.2, dist: 6.2, target: [0, 0.2, 0], shift: -0.2 },
      { t: 0.45, az: -0.18, el: 0.1, dist: 2.6, target: [0, 0.33, -0.15], shift: -0.2 },
      { t: 0.75, az: 0, el: 0.0, dist: 0.5, target: [0, 0.333, -0.15], shift: 0 },
      { t: 1, az: 0, el: 0.0, dist: 0.48, target: [0, 0.333, -0.15], shift: 0 },
    ],
    animation: { yaw: [0, 0], scale: [1, 1], extras: ['crt'] },
    transition: { type: 'screen', zone: 0.36 },
  },
  {
    id: 'network',
    label: '1990s',
    year: '1990s',
    title: 'COMPUTERS ARE NO LONGER ALONE.',
    subtitle: 'Machines become connected.',
    description:
      'Computing evolves from isolated machines into interconnected systems.',
    asset: null,
    model: null,
    duration: 450,
    align: 'left',
    theme: {
      accent: '#aef2ff',
      bg: '#02080c',
      fog: 0.03,
      light: rig(['#10303a', 0.6], ['#ffffff', 1, [3, 4, 3]], ['#6adfff', 1, [-4, 2, -3]], ['#0b2630', 0.5, [0, 0, 4]]),
    },
    camera: [
      { t: 0, az: 0, el: 0.05, dist: 12, target: [0, 0, 0], shift: 0.14 },
      { t: 0.5, az: 1.4, el: 0.2, dist: 9.5, target: [0, 0, 0], shift: 0.14 },
      { t: 1, az: 2.9, el: 0.1, dist: 8, target: [0, 0, 0], shift: 0.14 },
    ],
    animation: { yaw: [0, 0], scale: [1, 1], particles: 'data', extras: ['network'] },
    transition: { type: 'flow', zone: 0.34 },
  },
  {
    id: 'ai',
    label: 'TODAY',
    year: '2020s',
    title: 'TODAY',
    subtitle: 'THE COMPUTER BECAME A NETWORK.',
    description:
      'Modern computing is no longer defined by a single machine. Processing power is distributed across data centers, networks and specialized hardware.',
    asset: 'datacenter',
    model: model('datacenter'),
    duration: 550,
    align: 'left',
    theme: {
      accent: '#8a7bff',
      bg: '#020208',
      fog: 0.05,
      light: rig(['#16124a', 0.7], ['#b9c6ff', 2, [3, 5, 3]], ['#7a5bff', 4, [-4, 2, -3]], ['#123a8a', 1.4, [0, 1, 5]]),
    },
    camera: [
      { t: 0, az: 0, el: 0.1, dist: 9, target: [0, 1.4, 4], shift: 0.12 },
      { t: 0.5, az: 0, el: 0.04, dist: 7, target: [0, 1.4, -2], shift: 0.1 },
      { t: 1, az: 0, el: 0.02, dist: 6, target: [0, 1.5, -11], shift: 0 },
    ],
    animation: { yaw: [0, 0], scale: [1, 1], particles: 'dataDense', extras: ['datacenter', 'network'] },
  },
]

export const CHAPTER_COUNT = TIMELINE.length

/** Cumulative start positions in viewport heights (used before the DOM is measured). */
export const CHAPTER_STARTS_VH: number[] = TIMELINE.reduce<number[]>((acc, _c, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + TIMELINE[i - 1].duration)
  return acc
}, [])

export const chapterIndexById = (id: ChapterId): number => TIMELINE.findIndex((c) => c.id === id)

/** Chapters shown in the timeline indicator (the hero is not a chapter). */
export const INDICATOR_ITEMS = TIMELINE.map((c, index) => ({ id: c.id, label: c.label, index })).filter(
  (c) => c.id !== 'hero',
)
