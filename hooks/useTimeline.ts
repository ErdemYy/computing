'use client'

import { CHAPTER_COUNT, TIMELINE, type TimelineChapter } from '@/data/timeline'
import { useUI } from '@/lib/experienceState'

/** The chapter currently owning the viewport (re-renders only when the chapter changes). */
export function useTimeline(): { index: number; chapter: TimelineChapter; total: number } {
  const index = useUI((s) => s.activeChapter)
  return { index, chapter: TIMELINE[index], total: CHAPTER_COUNT }
}
