'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { exp, useUI } from '@/lib/experienceState'
import { registerGsap, ScrollTrigger } from '@/lib/gsap'
import { TIMELINE, chapterIndexById } from '@/data/timeline'
import { layerPresence } from '@/lib/stage'
import { useScrollProgress } from '@/hooks/useScrollProgress'
import { AllChapterContent } from './ChapterContent'

const CRT_CHAPTERS = TIMELINE.map((c, i) => (c.animation.extras?.includes('crt') ? i : -1)).filter((i) => i >= 0)
const HERO = chapterIndexById('hero')

/**
 * Fixed DOM layer above the WebGL canvas: hero type, every chapter's text, CRT scanlines and grain.
 * All motion is scrubbed by scroll — nothing here renders per frame in React.
 */
export function ExperienceOverlay() {
  const hero = useRef<HTMLDivElement>(null)
  const crt = useRef<HTMLDivElement>(null)
  const intro = useUI((s) => s.intro)

  // hero: scroll-scrubbed fade away
  useLayoutEffect(() => {
    const gsap = registerGsap()
    const el = hero.current
    const section = document.querySelector<HTMLElement>(`[data-section="hero"]`)
    if (!el || !section) return
    const ctx = gsap.context(() => {
      gsap
        .timeline({ scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true } })
        .to('[data-hero-title]', { opacity: 0, yPercent: exp.reduced ? 0 : -14, letterSpacing: exp.reduced ? '0.12em' : '0.26em', ease: 'power1.in', duration: 0.42 }, 0)
        .to('[data-hero-sub]', { opacity: 0, yPercent: exp.reduced ? 0 : -30, ease: 'power1.in', duration: 0.34 }, 0)
        .to('[data-hero-years]', { opacity: 0, ease: 'power1.in', duration: 0.3 }, 0)
        .to('[data-hero-scroll]', { opacity: 0, ease: 'power1.in', duration: 0.12 }, 0)
        .set({}, {}, 1)
    }, el)
    return () => {
      ctx.revert()
      ScrollTrigger.refresh()
    }
  }, [])

  // hero: cinematic entrance once the loading screen leaves
  useEffect(() => {
    if (!intro) return
    const gsap = registerGsap()
    const el = hero.current
    if (!el) return
    const ctx = gsap.context(() => {
      const r = exp.reduced
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .fromTo('[data-hero-char]', { yPercent: r ? 0 : 105, opacity: 0 }, { yPercent: 0, opacity: 1, duration: r ? 0.4 : 1.5, stagger: r ? 0 : 0.055 }, 0.1)
        .fromTo('[data-hero-sub] .intro-in', { opacity: 0, y: r ? 0 : 12 }, { opacity: 1, y: 0, duration: 1.2 }, 0.9)
        .fromTo('[data-hero-years] .intro-in', { opacity: 0 }, { opacity: 1, duration: 1.2 }, 1.2)
        .fromTo('[data-hero-scroll] .intro-in', { opacity: 0 }, { opacity: 1, duration: 1 }, 1.7)
    }, el)
    return () => ctx.revert()
  }, [intro])

  // CRT scanlines follow the "crt" chapters' presence (written straight to the DOM)
  useScrollProgress(() => {
    const el = crt.current
    if (!el) return
    let p = 0
    for (const i of CRT_CHAPTERS) p = Math.max(p, layerPresence(i))
    if (exp.reduced) p *= 0.4
    el.style.opacity = String(Math.min(1, p) * 0.9)
  })

  const title = 'COMPUTING'

  return (
    <div className="experience-overlay" aria-live="off">
      <div ref={hero} className="hero" data-chapter-text="hero" data-index={HERO}>
        <h1 data-hero-title className="hero-title" aria-label="COMPUTING">
          <span className="sr-only">COMPUTING</span>
          {title.split('').map((ch, i) => (
            <span key={i} className="hero-mask" aria-hidden>
              <span data-hero-char className="hero-char">
                {ch}
              </span>
            </span>
          ))}
        </h1>
        <p data-hero-sub className="hero-sub" lang="tr">
          <span className="intro-in">BİLGİSAYARIN EVRİMİ</span>
        </p>
        <p data-hero-years className="hero-years">
          <span className="intro-in">1820 → 2026</span>
        </p>
        <p data-hero-scroll className="hero-scroll">
          <span className="intro-in hero-scroll-in">
            <span>SCROLL TO EXPLORE</span>
            <i aria-hidden />
          </span>
        </p>
      </div>

      <AllChapterContent />

      <div ref={crt} className="crt" aria-hidden />
      <div className="grain" aria-hidden />
    </div>
  )
}
