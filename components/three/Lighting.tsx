'use client'

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AmbientLight, Color, DirectionalLight, FogExp2 } from 'three'
import { exp } from '@/lib/experienceState'

/**
 * Per-chapter lighting profile, blended by the stage director: ambient, key, rim and fill lights,
 * plus scene background / fog following the theme.
 */
export function Lighting() {
  const ambient = useRef<AmbientLight>(null)
  const key = useRef<DirectionalLight>(null)
  const rim = useRef<DirectionalLight>(null)
  const fill = useRef<DirectionalLight>(null)
  const scene = useThree((s) => s.scene)

  useFrame(() => {
    const L = exp.live
    if (!scene.background) scene.background = new Color()
    ;(scene.background as Color).copy(L.bg)
    if (!scene.fog) scene.fog = new FogExp2(0x000000, 0.04)
    const fog = scene.fog as FogExp2
    fog.color.copy(L.bg)
    fog.density = L.fog
    scene.environmentIntensity = L.envIntensity

    if (ambient.current) {
      ambient.current.color.copy(L.ambientColor)
      ambient.current.intensity = L.ambient
    }
    if (key.current) {
      key.current.color.copy(L.keyColor)
      key.current.intensity = L.key
      key.current.position.copy(L.keyPos)
    }
    if (rim.current) {
      rim.current.color.copy(L.rimColor)
      rim.current.intensity = L.rim
      rim.current.position.copy(L.rimPos)
    }
    if (fill.current) {
      fill.current.color.copy(L.fillColor)
      fill.current.intensity = L.fill
      fill.current.position.copy(L.fillPos)
    }
  })

  return (
    <>
      <ambientLight ref={ambient} intensity={0.4} />
      <directionalLight ref={key} intensity={2} position={[3, 4, 3]} />
      <directionalLight ref={rim} intensity={2} position={[-4, 2, -3]} />
      <directionalLight ref={fill} intensity={0.6} position={[0, 0, 4]} />
    </>
  )
}
