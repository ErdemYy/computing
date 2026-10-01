'use client'

import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Object3D } from 'three'
import { ASSETS } from '@/data/assets'
import { TIMELINE } from '@/data/timeline'
import { setModelStatus } from '@/lib/experienceState'
import { disposeModel, loadGLTF, prepareModel, setModelOpacity } from '@/lib/modelLoader'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { modelEffect } from '@/lib/stage'
import { exp } from '@/lib/experienceState'
import { MathUtils } from 'three'
import { profileFor } from '@/lib/performance'

const RACK_SPACING = 1.0
const RACK_AISLE = 2.1

interface Props {
  chapterIndex: number
}

/** Catches loader / parse errors so one broken model never takes the whole canvas down. */
class ModelBoundary extends Component<{ id: string; fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    setModelStatus(this.props.id, 'failed')
    if (process.env.NODE_ENV !== 'production') console.warn(`[computing] model "${this.props.id}" failed to load`, error)
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/** Wireframe stand-in used while a model is unavailable. */
function FallbackShape({ chapterIndex }: Props) {
  const ref = useRef<Group>(null)
  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    const e = modelEffect(chapterIndex)
    g.visible = e.opacity > 0.01
    g.scale.setScalar(e.scale)
    g.rotation.y += dt * 0.2
  })
  return (
    <group ref={ref}>
      <mesh>
        <boxGeometry args={[2, 1.4, 1.6]} />
        <meshBasicMaterial color={TIMELINE[chapterIndex].theme.accent} wireframe transparent opacity={0.4} />
      </mesh>
    </group>
  )
}

function LoadedModel({ chapterIndex, gltf }: Props & { gltf: GLTF }) {
  const chapter = TIMELINE[chapterIndex]
  const asset = ASSETS[chapter.asset!]
  const prepared = useMemo(() => prepareModel(gltf.scene), [gltf.scene])
  const group = useRef<Group>(null)

  const isRack = chapter.id === 'ai'
  const racks = useMemo(() => {
    if (!isRack) return null
    const perSide = profileFor(exp.tier).racks
    const out: { key: string; obj: Object3D; pos: [number, number, number]; yaw: number }[] = []
    for (let i = 0; i < perSide; i++) {
      const z = 5 - i * RACK_SPACING
      out.push({ key: `l${i}`, obj: prepared.root.clone(true), pos: [-RACK_AISLE, 0, z], yaw: Math.PI })
      out.push({ key: `r${i}`, obj: prepared.root.clone(true), pos: [RACK_AISLE, 0, z], yaw: 0 })
    }
    return out
  }, [isRack, prepared])

  useEffect(() => {
    setModelStatus(asset.id, 'ready')
    exp.floors[chapterIndex] = -(prepared.size.y / 2) * asset.scale * chapter.animation.scale[0]
    return () => disposeModel(prepared)
  }, [asset.id, asset.scale, chapter.animation.scale, chapterIndex, prepared])

  useFrame(() => {
    const g = group.current
    if (!g) return
    const e = modelEffect(chapterIndex)
    const visible = e.opacity > 0.004
    if (g.visible !== visible) g.visible = visible
    if (!visible) return
    setModelOpacity(prepared, e.opacity)
    const [y0, y1] = chapter.animation.yaw
    const [s0, s1] = chapter.animation.scale
    const t = exp.live.c === chapterIndex ? exp.local : exp.live.c < chapterIndex ? 0 : 1
    const motion = exp.reduced ? 0.3 : 1
    g.rotation.y = asset.yaw + MathUtils.lerp(y0, y1, t) * motion
    g.scale.setScalar(asset.scale * MathUtils.lerp(s0, s1, t) * e.scale)
    g.position.y = asset.lift + e.y
  })

  return (
    <group ref={group} visible={false}>
      {racks ? (
        racks.map((r) => (
          <group key={r.key} position={r.pos} rotation={[0, r.yaw, 0]}>
            <primitive object={r.obj} />
          </group>
        ))
      ) : (
        <primitive object={prepared.root} />
      )}
    </group>
  )
}

/** One chapter's model: loads lazily, shows a fallback if the file is missing, never throws upward. */
export function ModelRenderer({ chapterIndex }: Props) {
  const chapter = TIMELINE[chapterIndex]
  const [gltf, setGltf] = useState<GLTF | null>(null)
  const [failed, setFailed] = useState(false)
  const path = chapter.model
  const id = chapter.asset

  useEffect(() => {
    if (!path || !id) return
    let alive = true
    setModelStatus(id, 'loading')
    loadGLTF(path)
      .then((g) => alive && setGltf(g))
      .catch((err) => {
        if (!alive) return
        if (process.env.NODE_ENV !== 'production') console.warn(`[computing] model "${id}" unavailable`, err)
        setModelStatus(id, 'failed')
        setFailed(true)
      })
    return () => {
      alive = false
    }
  }, [path, id])

  if (!id || !path) return null
  const fallback = <FallbackShape chapterIndex={chapterIndex} />
  if (failed) return fallback
  if (!gltf) return null
  return (
    <ModelBoundary id={id} fallback={fallback}>
      <LoadedModel chapterIndex={chapterIndex} gltf={gltf} />
    </ModelBoundary>
  )
}
