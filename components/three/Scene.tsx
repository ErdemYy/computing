'use client'

import { useEffect } from 'react'
import { PerformanceMonitor } from '@react-three/drei'
import { TIMELINE, chapterIndexById } from '@/data/timeline'
import { useUI } from '@/lib/experienceState'
import { clearChapter, preloadChapter } from '@/lib/modelLoader'
import { lowerTier } from '@/lib/performance'
import { CameraController } from './CameraController'
import { StageEnvironment } from './Environment'
import { CircuitTraces, DataStreams, GridFloor } from './Extras'
import { Lighting } from './Lighting'
import { ModelRenderer } from './ModelRenderer'
import { NetworkScene } from './NetworkScene'
import { ParticleField } from './ParticleField'
import { PostProcessing } from './PostProcessing'

const AI = chapterIndexById('ai')

/** Everything that lives inside the single fixed <Canvas>. */
export function Scene({ onDegrade }: { onDegrade: () => void }) {
  const active = useUI((s) => s.activeChapter)
  const ready = useUI((s) => s.ready)

  // Lazy model strategy: first chapter loads with the loading screen; afterwards only the
  // neighbours of the active chapter are mounted / prefetched, far ones are released.
  useEffect(() => {
    if (!ready) return
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number }
    const idle = (fn: () => void) => (w.requestIdleCallback ? w.requestIdleCallback(fn) : window.setTimeout(fn, 200))
    idle(() => {
      preloadChapter(active + 1)
      preloadChapter(active + 2)
    })
    TIMELINE.forEach((_, i) => {
      if (Math.abs(i - active) > 2) clearChapter(i)
    })
  }, [active, ready])

  return (
    <>
      <PerformanceMonitor onDecline={onDegrade} flipflops={2} />
      <CameraController />
      <Lighting />
      <StageEnvironment />

      {TIMELINE.map((ch, i) =>
        ch.asset && Math.abs(i - active) <= 1 ? <ModelRenderer key={ch.id} chapterIndex={i} /> : null,
      )}

      {TIMELINE.map((ch, i) =>
        ch.animation.particles && Math.abs(i - active) <= 1 ? (
          <ParticleField key={`p-${ch.id}`} kind={ch.animation.particles} chapterIndex={i} />
        ) : null,
      )}

      {TIMELINE.map((ch, i) =>
        ch.animation.extras?.includes('grid') ? <GridFloor key={`g-${ch.id}`} chapterIndex={i} /> : null,
      )}
      <GridFloor chapterIndex={AI} cell={0.8} radius={22} />
      <CircuitTraces />
      <NetworkScene />
      <DataStreams />

      <PostProcessing />
    </>
  )
}

