'use client'

import { useEffect } from 'react'
import { TIMELINE } from '@/data/timeline'
import { useUI } from '@/lib/experienceState'
import { audio } from '@/lib/audio'

/** Wires chapter changes to the (optional) audio system. Renders nothing. */
export function AudioController() {
  const active = useUI((s) => s.activeChapter)

  useEffect(() => {
    audio.init()
  }, [])

  useEffect(() => {
    audio.setChapter(TIMELINE[active].id)
  }, [active])

  return null
}

/** Header sound switch. Hidden entirely while no audio tracks are configured. */
export function AudioToggle() {
  const available = useUI((s) => s.audioAvailable)
  const muted = useUI((s) => s.muted)
  if (!available) return null
  return (
    <button type="button" onClick={() => audio.toggle()} aria-pressed={!muted} aria-label={muted ? 'Turn sound on' : 'Turn sound off'}>
      {muted ? 'SOUND OFF' : 'SOUND ON'}
    </button>
  )
}
