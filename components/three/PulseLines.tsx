'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { exp } from '@/lib/experienceState'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, LineSegments, ShaderMaterial } from 'three'

const vertex = /* glsl */ `
  attribute float aT;
  attribute float aSeed;
  varying float vT;
  varying float vSeed;
  void main() {
    vT = aT;
    vSeed = aSeed;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uFreq;
  uniform float uBase;
  uniform float uPulse;
  uniform float uPresence;
  uniform float uBloom;
  varying float vT;
  varying float vSeed;
  void main() {
    float ph = fract(vT * uFreq - uTime * uSpeed * (0.6 + vSeed * 0.8) + vSeed * 7.0);
    float pulse = pow(1.0 - ph, 9.0);
    float a = (uBase + uPulse * pulse) * uPresence;
    gl_FragColor = vec4(uColor * (uBloom * (0.6 + pulse * 1.4)), a);
  }
`

export interface PulseLinesProps {
  /** xyz pairs (two vertices per segment) */
  positions: Float32Array
  /** distance parameter per vertex (any range, used with `freq`) */
  t: Float32Array
  /** one random seed per vertex */
  seed: Float32Array
  /** colour source. A fixed hex string or 'accent' to follow the live theme accent */
  color: string | 'accent'
  speed?: number
  freq?: number
  base?: number
  pulse?: number
  bloom?: number
  /** returns 0..1 visibility each frame */
  presence: () => number
  position?: [number, number, number]
}

/** Line segments with glowing data pulses travelling along them (circuits, network edges, streams). */
export function PulseLines({ positions, t, seed, color, speed = 0.5, freq = 1, base = 0.12, pulse = 0.9, bloom = 1.4, presence, position }: PulseLinesProps) {
  const ref = useRef<LineSegments>(null)

  const { geometry, material } = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(positions, 3))
    g.setAttribute('aT', new BufferAttribute(t, 1))
    g.setAttribute('aSeed', new BufferAttribute(seed, 1))
    const m = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uColor: { value: new Color(color === 'accent' ? '#ffffff' : color) },
        uTime: { value: 0 },
        uSpeed: { value: speed },
        uFreq: { value: freq },
        uBase: { value: base },
        uPulse: { value: pulse },
        uPresence: { value: 0 },
        uBloom: { value: bloom },
      },
    })
    return { geometry: g, material: m }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, t, seed])

  useFrame(({ clock }) => {
    const l = ref.current
    if (!l) return
    const p = presence()
    const visible = p > 0.01
    if (l.visible !== visible) l.visible = visible
    if (!visible) return
    const u = material.uniforms
    u.uTime.value = clock.elapsedTime
    u.uPresence.value = p
    if (color === 'accent') (u.uColor.value as Color).copy(exp.live.accent)
  })

  return <lineSegments ref={ref} geometry={geometry} material={material} position={position} frustumCulled={false} visible={false} />
}

