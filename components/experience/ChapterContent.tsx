'use client'

import { useLayoutEffect, useRef } from 'react'
import { CHAPTER_COUNT, TIMELINE, type TimelineChapter } from '@/data/timeline'
import { exp } from '@/lib/experienceState'
import { registerGsap, ScrollTrigger } from '@/lib/gsap'

interface Props {
  chapter: TimelineChapter
  index: number
}

const lines = (s: string) => s.split('\n')

/**
 * One chapter's typography. Every element has its own reveal (clip, tracking, wipe, rise) and the
 * whole timeline is scrubbed by the chapter's scroll section, so scrolling backwards un-reveals it.
 */
export function ChapterContent({ chapter, index }: Props) {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const gsap = registerGsap()
    const el = root.current
    const section = document.querySelector<HTMLElement>(`[data-section="${chapter.id}"]`)
    if (!el || !section) return
    const q = <T extends Element = HTMLElement>(sel: string) => gsap.utils.toArray<T>(sel, el)

    const reduced = exp.reduced
    const zone = chapter.transition?.zone ?? 0
    const isAI = chapter.id === 'ai'
    const inAt = 0.045
    const outAt = isAI ? 0.3 : 1 - zone - 0.085

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: reduced ? true : 0.6 },
      })

      gsap.set(el, { autoAlpha: 1 })
      // initial hidden states are set by the tweens' `from` values (immediateRender)
      tl.fromTo(q('[data-plate]'), { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.05 }, inAt - 0.01)
      tl.fromTo(
        q('[data-year]'),
        { opacity: 0, letterSpacing: reduced ? '0.1em' : '0.55em', yPercent: reduced ? 0 : 18 },
        { opacity: 1, letterSpacing: '0.04em', yPercent: 0, duration: 0.075, ease: 'power3.out' },
        inAt,
      )
      tl.fromTo(
        q('[data-line]'),
        { yPercent: reduced ? 0 : 112, opacity: reduced ? 0 : 1 },
        { yPercent: 0, opacity: 1, duration: 0.06, stagger: 0.018, ease: 'power3.out' },
        inAt + 0.012,
      )
      tl.fromTo(
        q('[data-sub]'),
        { clipPath: 'inset(0 100% 0 0)', opacity: 0 },
        { clipPath: 'inset(0 0% 0 0)', opacity: 1, duration: 0.065, ease: 'power2.inOut' },
        inAt + 0.045,
      )
      tl.fromTo(
        q('[data-desc]'),
        { opacity: 0, y: reduced ? 0 : 26 },
        { opacity: 1, y: 0, duration: 0.07 },
        inAt + 0.075,
      )

      // exit — a different gesture than the entrance: tracking opens up, lines lift away, text fades
      tl.to(q('[data-desc]'), { opacity: 0, y: reduced ? 0 : -18, duration: 0.04, ease: 'power1.in' }, outAt)
      tl.to(q('[data-sub]'), { opacity: 0, x: reduced ? 0 : -24, duration: 0.04, ease: 'power1.in' }, outAt + 0.005)
      tl.to(q('[data-line]'), { yPercent: reduced ? 0 : -112, opacity: reduced ? 0 : 1, duration: 0.045, stagger: 0.01, ease: 'power2.in' }, outAt + 0.008)
      tl.to(q('[data-year]'), { opacity: 0, letterSpacing: reduced ? '0.04em' : '0.3em', duration: 0.05, ease: 'power1.in' }, outAt + 0.012)
      tl.to(q('[data-plate]'), { opacity: 0, duration: 0.03 }, outAt + 0.02)

      if (isAI) {
        // final message + signature, then hand over to the editorial sections
        tl.fromTo(
          q('[data-final-line]'),
          { yPercent: reduced ? 0 : 115, opacity: reduced ? 0 : 1 },
          { yPercent: 0, opacity: 1, duration: 0.05, stagger: 0.03, ease: 'power3.out' },
          0.56,
        )
        tl.to(q('[data-final-line]'), { yPercent: reduced ? 0 : -115, opacity: reduced ? 0 : 1, duration: 0.04, stagger: 0.015, ease: 'power2.in' }, 0.835)
        tl.fromTo(q('[data-outro]'), { opacity: 0, letterSpacing: '0.6em' }, { opacity: 1, letterSpacing: '0.28em', duration: 0.06 }, 0.885)
      }
      // pad the timeline to exactly 1 so scroll progress maps 1:1 onto the positions above
      tl.set({}, {}, 1)
    }, el)

    return () => {
      ctx.revert()
      ScrollTrigger.refresh()
    }
  }, [chapter])

  const n = String(index).padStart(2, '0')
  const total = String(CHAPTER_COUNT - 1).padStart(2, '0')

  return (
    <article
      ref={root}
      data-chapter-text={chapter.id}
      data-align={chapter.align}
      aria-labelledby={`h-${chapter.id}`}
      lang="en"
      className="chapter-text"
    >
      <div className="chapter-block">
        <p data-plate className="chapter-plate">
          <span>CHAPTER {n}</span>
          <i aria-hidden />
          <span>{total}</span>
        </p>
        <p data-year className="chapter-year">
          {chapter.year}
        </p>
        <h2 id={`h-${chapter.id}`} className="chapter-title">
          {lines(chapter.title).map((l, i) => (
            <span key={i} className="line-mask">
              <span data-line className="line-inner">
                {l}
              </span>
            </span>
          ))}
        </h2>
        <p data-sub className="chapter-sub">
          {chapter.subtitle}
        </p>
        <p data-desc className="chapter-desc">
          {chapter.description}
        </p>
      </div>

      {chapter.id === 'ai' && (
        <>
          <div className="final-message" aria-label="The next computer may not look like a computer at all.">
            {['THE NEXT COMPUTER', 'MAY NOT LOOK LIKE', 'A COMPUTER AT ALL.'].map((l) => (
              <span key={l} className="line-mask">
                <span data-final-line className="line-inner" aria-hidden>
                  {l}
                </span>
              </span>
            ))}
          </div>
          <p data-outro className="outro-sign" lang="tr">
            COMPUTING · BİLGİSAYARIN EVRİMİ
          </p>
        </>
      )}
    </article>
  )
}

/** Convenience: every non-hero chapter's text, stacked in the fixed overlay. */
export function AllChapterContent() {
  return (
    <>
      {TIMELINE.map((c, i) => (c.id === 'hero' ? null : <ChapterContent key={c.id} chapter={c} index={i} />))}
    </>
  )
}
