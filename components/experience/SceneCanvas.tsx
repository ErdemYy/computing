'use client'

import { Component, useCallback, useState, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { exp, setModelStatus, setUI, useUI, type Tier } from '@/lib/experienceState'
import { detectTier, lowerTier, profileFor } from '@/lib/performance'
import { Scene } from '@/components/three/Scene'

/** If WebGL itself fails the page keeps working as typography on black. */
class CanvasBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV !== 'production') console.warn('[computing] WebGL scene failed', error)
    setModelStatus('babbage', 'failed')
    setUI({ canvasActive: false })
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

export default function SceneCanvas() {
  const [tier, setTier] = useState<Tier>(() => {
    const t = detectTier()
    exp.tier = t
    return t
  })
  const active = useUI((s) => s.canvasActive)
  const profile = profileFor(tier)

  const degrade = useCallback(() => {
    setTier((t) => {
      const next = lowerTier(t)
      exp.tier = next
      return next
    })
  }, [])

  return (
    <div className="canvas-layer" aria-hidden>
      <CanvasBoundary>
        <Canvas
          key={profile.postprocessing ? 'post' : 'plain'}
          frameloop={active ? 'always' : 'never'}
          dpr={profile.dpr}
          flat={profile.postprocessing}
          camera={{ fov: 32, near: 0.04, far: 90, position: [0, 0, 9] }}
          gl={{ antialias: !profile.postprocessing, alpha: false, stencil: false, powerPreference: 'high-performance' }}
          performance={{ min: 0.5 }}
        >
          <Scene onDegrade={degrade} />
        </Canvas>
      </CanvasBoundary>
    </div>
  )
}
