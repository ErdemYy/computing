'use client'

import { useRef } from 'react'
import { useUI } from '@/lib/experienceState'
import { useScrollProgress } from '@/hooks/useScrollProgress'
import { scrollTo, scrollToChapter } from '@/lib/scroll'
import { AudioToggle } from '@/components/experience/AudioController'

/** Small fixed header. Starts almost invisible and becomes legible as the user scrolls. */
export function Header() {
  const ref = useRef<HTMLElement>(null)
  const intro = useUI((s) => s.intro)

  useScrollProgress((s) => {
    const el = ref.current
    if (!el) return
    const o = 0.32 + Math.min(1, s.scrollY / 600) * 0.6
    el.style.setProperty('--header-o', o.toFixed(3))
  })

  return (
    <header ref={ref} className="site-header" data-visible={intro}>
      <button type="button" className="hd-left" onClick={() => scrollTo(0)} aria-label="Back to the beginning">
        COMPUTING
      </button>
      <button type="button" className="hd-mid" onClick={() => scrollToChapter('babbage')} aria-label="Jump to the timeline">
        TIMELINE
      </button>
      <div className="hd-right">
        <AudioToggle />
        <button type="button" onClick={() => scrollTo('#about')} aria-label="Jump to the about section">
          ABOUT
        </button>
      </div>
    </header>
  )
}
