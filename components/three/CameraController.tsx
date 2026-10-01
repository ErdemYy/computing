'use client'

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from 'three'
import { exp } from '@/lib/experienceState'
import { directStage } from '@/lib/stage'
import { profileFor } from '@/lib/performance'

/**
 * Runs the stage director at the very start of every frame and applies the resulting pose to the
 * camera. All scroll → camera mapping lives in lib/stage.ts; this component only owns the camera.
 */
export function CameraController() {
  const size = useThree((s) => s.size)
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const lastAccent = useRef('')

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    const aspect = size.width / size.height
    directStage({ dt, aspect, parallax: profileFor(exp.tier).parallax })
    const L = exp.live

    camera.position.copy(L.camPos)
    camera.lookAt(L.camTarget)
    if (Math.abs(camera.fov - L.fov) > 0.01) camera.fov = L.fov

    // horizontal frame offset (pushes the model away from the text column)
    const off = -L.shiftX * size.width
    camera.setViewOffset(size.width, size.height, off, 0, size.width, size.height)

    // publish the accent colour to CSS (cheap: only when it actually changed)
    const hex = '#' + L.accent.getHexString()
    if (hex !== lastAccent.current) {
      document.documentElement.style.setProperty('--accent', hex)
      lastAccent.current = hex
    }
  }, -100)

  return null
}
