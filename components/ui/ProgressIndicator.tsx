'use client'

import { CHAPTER_COUNT } from '@/data/timeline'
import { useUI } from '@/lib/experienceState'

/** Tiny chapter counter, bottom right. Purely informational. */
export function ProgressIndicator() {
  const active = useUI((s) => s.activeChapter)
  const intro = useUI((s) => s.intro)
  const canvasActive = useUI((s) => s.canvasActive)
  const visible = intro && canvasActive && active > 0
  const total = CHAPTER_COUNT - 1

  return (
    <p className="progress-indicator" data-visible={visible} aria-hidden>
      <span>{String(Math.max(active, 1)).padStart(2, '0')}</span>
      <i />
      <span>{String(total).padStart(2, '0')}</span>
    </p>
  )
}
