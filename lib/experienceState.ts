import { useSyncExternalStore } from 'react'
import { Color, Vector3 } from 'three'
import { TIMELINE } from '@/data/timeline'

export type Tier = 'high' | 'medium' | 'low'

/**
 * Hot, mutable state. Written by the scroll controller / stage director, read inside
 * animation frames. NEVER put this in React state — it changes on every scroll tick.
 */
export const exp = {
  /** raw scroll position in px (post-Lenis smoothing) */
  scrollY: 0,
  /** integer chapter index currently owning the viewport */
  chapter: 0,
  /** chapter-local progress 0..1 */
  local: 0,
  /** overall progress through the whole chapter track 0..1 */
  progress: 0,
  /** normalised mouse position -1..1 (smoothed) */
  mouse: { x: 0, y: 0 },
  reduced: false,
  tier: 'high' as Tier,
  /** world-space floor height (bottom of the model) per chapter index, filled when models load */
  floors: {} as Record<number, number>,
  /** values computed once per frame by the StageDirector, consumed by scene components */
  live: {
    c: 0,
    next: 1,
    /** 0..1 progress through the transition into the next chapter */
    b: 0,
    type: 'none' as 'none' | 'dissolve' | 'shrink' | 'screen' | 'flow',
    camPos: new Vector3(0, 0, 8),
    camTarget: new Vector3(),
    fov: 32,
    shiftX: 0,
    bg: new Color('#000000'),
    accent: new Color('#ffffff'),
    fog: 0.04,
    /** 0 = fully lit, 1 = pitch black (used by dramatic transitions) */
    darkness: 0,
    envIntensity: 0.4,
    ambientColor: new Color(),
    ambient: 0,
    keyColor: new Color(),
    key: 0,
    keyPos: new Vector3(),
    rimColor: new Color(),
    rim: 0,
    rimPos: new Vector3(),
    fillColor: new Color(),
    fill: 0,
    fillPos: new Vector3(),
  },
}

/** Number of chapters, handy for clamping. */
export const LAST_CHAPTER = TIMELINE.length - 1

// ───────────────────────────── low-frequency UI store ─────────────────────────────

export type ModelStatus = 'idle' | 'loading' | 'ready' | 'failed'

export interface UIState {
  /** true once the first model resolved (or failed) and loading finished */
  ready: boolean
  /** the opening transition finished — header and hero may animate */
  intro: boolean
  activeChapter: number
  /** false while the editorial About/Credits sections cover the canvas */
  canvasActive: boolean
  models: Record<string, ModelStatus>
  muted: boolean
  audioAvailable: boolean
}

let state: UIState = {
  ready: false,
  intro: false,
  activeChapter: 0,
  canvasActive: true,
  models: {},
  muted: true,
  audioAvailable: false,
}

const listeners = new Set<() => void>()

export const getUI = () => state

export function setUI(patch: Partial<UIState>) {
  let changed = false
  for (const k of Object.keys(patch) as (keyof UIState)[]) {
    if (state[k] !== patch[k]) {
      changed = true
      break
    }
  }
  if (!changed) return
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

export function setModelStatus(id: string, status: ModelStatus) {
  if (state.models[id] === status) return
  state = { ...state, models: { ...state.models, [id]: status } }
  listeners.forEach((l) => l())
}

const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export function useUI<T>(selector: (s: UIState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  )
}
