'use client'

import { INDICATOR_ITEMS } from '@/data/timeline'
import { useUI } from '@/lib/experienceState'
import { scrollToChapter } from '@/lib/scroll'

/**
 * Discrete chapter markers (deliberately not a scrollbar). The active marker grows and lights up in
 * the live accent colour. Compact on small screens: only the active year is labelled.
 */
export function TimelineIndicator() {
  const active = useUI((s) => s.activeChapter)
  const intro = useUI((s) => s.intro)
  const canvasActive = useUI((s) => s.canvasActive)
  const visible = intro && canvasActive

  return (
    <nav className="timeline-indicator" data-visible={visible} aria-label="Computer history timeline">
      <ol>
        {INDICATOR_ITEMS.map((item) => {
          const isActive = item.index === active
          return (
            <li key={item.id} data-active={isActive}>
              <button
                type="button"
                onClick={() => scrollToChapter(item.id)}
                aria-label={`Go to ${item.label}`}
                aria-current={isActive ? 'step' : undefined}
                tabIndex={visible ? 0 : -1}
              >
                <span className="ti-label">{item.label}</span>
                <span className="ti-dot" aria-hidden />
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
