'use client'

import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, ShaderMaterial, Vector3 } from 'three'
import type { ParticleKind } from '@/data/timeline'
import { exp } from '@/lib/experienceState'
import { profileFor } from '@/lib/performance'
import { layerPresence } from '@/lib/stage'

interface Preset {
  count: number
  box: [number, number, number]
  center: [number, number, number]
  size: number
  speed: number
  drift: [number, number, number]
  color: string
  opacity: number
  flicker: number
  bloom: number
}

const PRESETS: Record<ParticleKind, Preset> = {
  dust: { count: 700, box: [16, 9, 16], center: [0, 0.5, 0], size: 0.035, speed: 1, drift: [0.03, 0.06, 0.02], color: '#ffb877', opacity: 0.5, flicker: 0, bloom: 1 },
  electric: { count: 380, box: [6, 4, 6], center: [0, 0, 0], size: 0.03, speed: 1, drift: [0.4, 0.05, 0.3], color: '#52dcff', opacity: 0.9, flicker: 1, bloom: 2.2 },
  data: { count: 800, box: [18, 12, 18], center: [0, 0, 0], size: 0.032, speed: 1, drift: [0.5, 0.05, 0.1], color: '#bff6ff', opacity: 0.75, flicker: 0.3, bloom: 1.6 },
  dataDense: { count: 1900, box: [10, 6, 30], center: [0, 1.5, -4], size: 0.026, speed: 1, drift: [0, 0.05, -2.2], color: '#8e8bff', opacity: 0.85, flicker: 0.4, bloom: 1.9 },
}

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uSpeed;
  uniform float uPxPerUnit;
  uniform float uFlicker;
  uniform vec3 uBox;
  uniform vec3 uDrift;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    float t = uTime * uSpeed;
    vec3 p = position;
    p += uDrift * t * (0.4 + aSeed * 1.2);
    p.x += sin(t * 0.6 + aSeed * 20.0) * 0.25;
    p.y += cos(t * 0.5 + aSeed * 13.0) * 0.2;
    p = mod(p + uBox * 0.5, uBox) - uBox * 0.5;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * uPxPerUnit * (0.5 + aSeed) / max(-mv.z, 0.1);
    gl_Position = projectionMatrix * mv;
    float fl = 1.0 - uFlicker * (0.5 + 0.5 * sin(uTime * (3.0 + aSeed * 9.0) + aSeed * 40.0));
    // fade at the box edges so wrapping is invisible
    vec3 e = abs(p) / (uBox * 0.5);
    float edge = 1.0 - smoothstep(0.75, 1.0, max(e.x, max(e.y, e.z)));
    vAlpha = fl * edge;
  }
`

const fragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uBloom;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    gl_FragColor = vec4(uColor * uBloom, a * vAlpha * uOpacity);
  }
`

interface Props {
  kind: ParticleKind
  chapterIndex: number
}

/** GPU-animated particle volume. Count scales with the quality tier and is off for reduced motion. */
export function ParticleField({ kind, chapterIndex }: Props) {
  const preset = PRESETS[kind]
  const points = useRef<Points>(null)
  const dpr = useThree((s) => s.viewport.dpr)
  const size = useThree((s) => s.size)
  const count = Math.max(0, Math.floor(preset.count * profileFor(exp.tier).particles))

  const { geometry, material } = useMemo(() => {
    const g = new BufferGeometry()
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * preset.box[0] + preset.center[0]
      pos[i * 3 + 1] = (Math.random() - 0.5) * preset.box[1] + preset.center[1]
      pos[i * 3 + 2] = (Math.random() - 0.5) * preset.box[2] + preset.center[2]
      seed[i] = Math.random()
    }
    g.setAttribute('position', new BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new BufferAttribute(seed, 1))
    const m = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: preset.size },
        uSpeed: { value: preset.speed },
        uPxPerUnit: { value: 800 },
        uFlicker: { value: preset.flicker },
        uBox: { value: new Vector3(...preset.box) },
        uDrift: { value: new Vector3(...preset.drift) },
        uColor: { value: null as unknown as import('three').Color },
        uOpacity: { value: 0 },
        uBloom: { value: preset.bloom },
      },
    })
    return { geometry: g, material: m }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, kind])

  useFrame(({ clock }) => {
    const p = points.current
    if (!p) return
    const presence = exp.reduced ? 0 : layerPresence(chapterIndex)
    const visible = presence > 0.01 && count > 0
    if (p.visible !== visible) p.visible = visible
    if (!visible) return
    const u = material.uniforms
    u.uTime.value = clock.elapsedTime
    u.uOpacity.value = preset.opacity * presence
    u.uPxPerUnit.value = (size.height * dpr) / (2 * Math.tan((exp.live.fov * Math.PI) / 360))
    if (!u.uColor.value) u.uColor.value = exp.live.accent.clone()
    // tint with the live accent, keeping the preset hue for dust/electric
    if (kind === 'data' || kind === 'dataDense') (u.uColor.value as import('three').Color).copy(exp.live.accent)
    else (u.uColor.value as import('three').Color).set(preset.color)
  })

  if (count === 0) return null
  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} visible={false} />
}
