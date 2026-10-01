'use client'

import { useEffect, useRef, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { getUI, setUI, useUI } from '@/lib/experienceState'
import { registerGsap } from '@/lib/gsap'
import { scrollApi } from '@/lib/scroll'

/** Hero-critical asset: the first chapter model. Loading finishes when it resolves (or fails). */
const CRITICAL = 'babbage'
const GIVE_UP_MS = 20000

/**
 * Real loading screen. The percentage comes from the three.js LoadingManager (actual bytes of the
 * assets being fetched) — there is no fake counter. It leaves with a short cinematic wipe.
 */
export function LoadingScreen() {
  const { progress, errors } = useProgress()
  const status = useUI((s) => s.models[CRITICAL])
  const root = useRef<HTMLDivElement>(null)
  const [gone, setGone] = useState(false)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setTimedOut(true), GIVE_UP_MS)
    return () => window.clearTimeout(t)
  }, [])

  const settled = status === 'ready' || status === 'failed' || errors.length > 0 || timedOut
  const shown = settled ? 100 : Math.min(99, Math.round(progress))

  const started = useRef(false)
  useEffect(() => {
    if (!settled || started.current) return
    const el = root.current
    if (!el) return
    started.current = true
    const gsap = registerGsap()
    setUI({ ready: true })
    // not cleaned up on purpose: the sequence must finish even though `ready` flips state mid-way
    gsap
      .timeline({
        onComplete: () => {
          setGone(true)
          scrollApi.lenis?.start()
          setUI({ intro: true })
        },
      })
      .to('[data-load-meta]', { opacity: 0, y: -8, duration: 0.5, ease: 'power2.in' }, 0.35)
      .to('[data-load-title]', { opacity: 0, letterSpacing: '0.5em', duration: 0.7, ease: 'power2.in' }, 0.4)
      .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'power3.inOut' }, 0.8)
  }, [settled])

  if (gone || getUI().intro) return null

  return (
    <div ref={root} className="loading-screen" role="status" aria-live="polite" aria-label="Loading experience">
      <div className="loading-inner">
        <p data-load-title className="loading-title">
          COMPUTING
        </p>
        <div data-load-meta className="loading-meta">
          <span>LOADING EXPERIENCE</span>
          <span className="loading-pct">{String(shown).padStart(3, '0')}</span>
        </div>
        <div data-load-meta className="loading-bar" aria-hidden>
          <i style={{ transform: `scaleX(${shown / 100})` }} />
        </div>
      </div>
    </div>
  )
}
