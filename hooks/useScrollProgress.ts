'use client'

import { useEffect, useRef } from 'react'
import { registerGsap } from '@/lib/gsap'
import { exp } from '@/lib/experienceState'

/**
 * Calls `cb` on every GSAP tick with the shared (mutable) scroll state.
 * Use it to write straight to DOM nodes / refs — it never triggers a React render.
 */
export function useScrollProgress(cb: (state: typeof exp, dt: number) => void) {
  const saved = useRef(cb)
  saved.current = cb
  useEffect(() => {
    const gsap = registerGsap()
    const tick = (_time: number, deltaTime: number) => saved.current(exp, deltaTime / 1000)
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])
}
