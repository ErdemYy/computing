'use client'

import dynamic from 'next/dynamic'
import { TIMELINE } from '@/data/timeline'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { About } from '@/components/ui/About'
import { Credits } from '@/components/ui/Credits'
import { Footer } from '@/components/ui/Footer'
import { Header } from '@/components/ui/Header'
import { ProgressIndicator } from '@/components/ui/ProgressIndicator'
import { AudioController } from './AudioController'
import { ExperienceOverlay } from './ExperienceOverlay'
import { LoadingScreen } from './LoadingScreen'
import { ScrollController } from './ScrollController'
import { TimelineIndicator } from './TimelineIndicator'

// WebGL is client only: never render the canvas on the server.
const SceneCanvas = dynamic(() => import('./SceneCanvas'), { ssr: false })

/** Scroll spacer: one empty section per chapter. Scroll position drives everything else. */
function ScrollTrack() {
  return (
    <div className="scroll-track">
      {TIMELINE.map((c) => (
        <section key={c.id} data-section={c.id} style={{ height: `${c.duration}vh` }} aria-hidden />
      ))}
      {/* hold: lets the final message breathe before the editorial sections slide over the canvas */}
      <section data-section="outro" style={{ height: '100vh' }} aria-hidden />
    </div>
  )
}

export function ComputerExperience() {
  useReducedMotion()

  return (
    <>
      <LoadingScreen />
      <Header />
      <TimelineIndicator />
      <ProgressIndicator />

      <SceneCanvas />
      <ExperienceOverlay />
      <ScrollTrack />

      <About />
      <Credits />
      <Footer />

      <ScrollController />
      <AudioController />
    </>
  )
}
