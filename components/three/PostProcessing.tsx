'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer, Noise, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import { exp } from '@/lib/experienceState'
import { profileFor } from '@/lib/performance'

/**
 * Restrained post stack: selective-looking bloom (high threshold so only emissives / pulses glow),
 * SMAA, filmic tone mapping, soft vignette, very faint grain.
 */
export function PostProcessing() {
  const profile = profileFor(exp.tier)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bloom = useRef<any>(null)

  useFrame(() => {
    const b = bloom.current
    if (!b) return
    // a touch more glow during the dark "shrink" cut, otherwise steady
    b.intensity = 0.5 + exp.live.darkness * 0.35
  })

  if (!profile.postprocessing) return null

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom ref={bloom} intensity={0.5} luminanceThreshold={0.92} luminanceSmoothing={0.2} mipmapBlur radius={0.7} />
      {profile.smaa ? <SMAA /> : <></>}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.25} darkness={0.62} eskil={false} />
      {profile.noise ? <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.35} /> : <></>}
    </EffectComposer>
  )
}
