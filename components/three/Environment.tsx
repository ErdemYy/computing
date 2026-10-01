'use client'

import { Environment, Lightformer } from '@react-three/drei'
import { BackSide } from 'three'

/**
 * Procedural studio environment for PBR reflections. Built from light-formers so there is no
 * HDR file to download (a drop-in `public/hdr/*.hdr` can replace it later).
 */
export function StageEnvironment() {
  return (
    <Environment resolution={256} frames={1} background={false}>
      {/* soft grey dome so polished metals (brass, chip ceramic) never reflect pure black */}
      <mesh scale={60}>
        <sphereGeometry args={[1, 32, 16]} />
        <meshBasicMaterial color="#5a5e66" side={BackSide} toneMapped={false} />
      </mesh>
      <Lightformer form="rect" intensity={4} color="#ffffff" position={[0, 5, 4]} scale={[10, 2.5, 1]} />
      <Lightformer form="rect" intensity={2.4} color="#9ec4ff" position={[-6, 1, -2]} rotation={[0, Math.PI / 2, 0]} scale={[6, 3, 1]} />
      <Lightformer form="rect" intensity={2.6} color="#ffd6a8" position={[6, 1, 2]} rotation={[0, -Math.PI / 2, 0]} scale={[6, 3, 1]} />
      <Lightformer form="ring" intensity={2} color="#ffffff" position={[0, -3, -5]} scale={4} />
    </Environment>
  )
}
