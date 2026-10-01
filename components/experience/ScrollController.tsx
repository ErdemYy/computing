'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import { TIMELINE } from '@/data/timeline'
import { exp, getUI, setUI } from '@/lib/experienceState'
import { registerGsap, ScrollTrigger } from '@/lib/gsap'
import { scrollApi } from '@/lib/scroll'
import { detectTier, profileFor } from '@/lib/performance'

/**
 * Owns scrolling: Lenis smooth scroll driven by the GSAP ticker, a master ScrollTrigger that maps
 * the scroll position onto (chapter, local progress), and smoothed mouse input.
 * Nothing here calls React setState per scroll tick — only when the active chapter changes.
 */
export function ScrollController() {
  useEffect(() => {
    const gsap = registerGsap()
    ScrollTrigger.config({ ignoreMobileResize: true })
    exp.tier = detectTier()

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    exp.reduced = reduced

    const lenis = new Lenis({
      lerp: reduced ? 1 : 0.085,
      smoothWheel: !reduced,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.15,
      autoRaf: false,
    })
    scrollApi.lenis = lenis
    // locked until the loading screen hands over
    if (!getUI().intro) lenis.stop()

    const onTick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(onTick)
    lenis.on('scroll', ScrollTrigger.update)

    // — measured section ranges (re-measured on every ScrollTrigger refresh) —
    let starts: number[] = []
    let ends: number[] = []
    let trackEnd = 0
    const measure = () => {
      starts = []
      ends = []
      TIMELINE.forEach((c) => {
        const el = document.querySelector<HTMLElement>(`[data-section="${c.id}"]`)
        if (!el) return
        starts.push(el.offsetTop)
        ends.push(el.offsetTop + el.offsetHeight)
      })
      const last = document.querySelector<HTMLElement>('[data-section="outro"]')
      trackEnd = last ? last.offsetTop + last.offsetHeight : (ends[ends.length - 1] ?? 0)
    }
    measure()

    const update = (y: number) => {
      exp.scrollY = y
      if (!starts.length) return
      let i = starts.length - 1
      for (let k = 0; k < starts.length; k++) {
        if (y < ends[k]) {
          i = k
          break
        }
      }
      const span = Math.max(1, ends[i] - starts[i])
      exp.chapter = i
      exp.local = Math.min(1, Math.max(0, (y - starts[i]) / span))
      exp.progress = Math.min(1, Math.max(0, y / Math.max(1, trackEnd)))
      if (getUI().activeChapter !== i) setUI({ activeChapter: i })
      // once the editorial sections fully cover the viewport there is no point rendering the canvas
      setUI({ canvasActive: y < trackEnd - 4 })
    }

    const master = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => update(self.scroll()),
      onRefresh: () => {
        measure()
        update(window.scrollY)
      },
    })

    // — mouse parallax (fine pointers only, never fights the scroll choreography) —
    const target = { x: 0, y: 0 }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      target.x = (e.clientX / window.innerWidth) * 2 - 1
      target.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    const onMouseTick = (_t: number, dtMs: number) => {
      const k = 1 - Math.exp(-3 * (dtMs / 1000))
      exp.mouse.x += (target.x - exp.mouse.x) * k
      exp.mouse.y += (target.y - exp.mouse.y) * k
    }
    gsap.ticker.add(onMouseTick)

    const onResize = () => {
      exp.tier = profileFor(detectTier()).tier
      ScrollTrigger.refresh()
    }
    window.addEventListener('resize', onResize)
    // measure again once fonts / layout settle
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 400)
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    update(window.scrollY)

    // restore from top on reload: the loading sequence always starts at the hero
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)

    return () => {
      window.clearTimeout(t)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onMove)
      gsap.ticker.remove(onTick)
      gsap.ticker.remove(onMouseTick)
      master.kill()
      lenis.destroy()
      scrollApi.lenis = null
    }
  }, [])

  return null
}
