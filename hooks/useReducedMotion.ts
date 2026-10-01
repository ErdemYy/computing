'use client'

import { useSyncExternalStore } from 'react'
import { exp } from '@/lib/experienceState'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY)
  const handler = () => {
    exp.reduced = mq.matches
    cb()
  }
  mq.addEventListener('change', handler)
  return () => mq.removeEventListener('change', handler)
}

const snapshot = () => {
  const v = window.matchMedia(QUERY).matches
  exp.reduced = v
  return v
}

/** Tracks `prefers-reduced-motion` and mirrors it into the shared experience state. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false)
}
