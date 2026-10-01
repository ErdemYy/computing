import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { Box3, Mesh, MeshPhysicalMaterial, Object3D, Texture, Vector3, type Material } from 'three'
import { ASSETS, type AssetId } from '@/data/assets'
import { TIMELINE } from '@/data/timeline'

/** Normalised display size (largest dimension) of every model, in scene units. */
export const MODEL_SIZE = 2.4

export interface PreparedModel {
  root: Object3D
  /** uniform scale that brings the largest dimension to MODEL_SIZE */
  scale: number
  /** size after normalisation */
  size: Vector3
  /** materials owned by this prepared model (safe to fade / dispose) */
  materials: FadeMaterial[]
}

export interface FadeMaterial {
  mat: Material & { opacity: number; transparent: boolean; depthWrite: boolean }
  baseOpacity: number
  baseTransparent: boolean
  baseDepthWrite: boolean
}

/**
 * Clones a cached glTF scene, gives it private materials (so fading never mutates the cache)
 * and measures it. Geometry is shared with the cache on purpose.
 */
export function prepareModel(source: Object3D): PreparedModel {
  const root = source.clone(true)
  const materials: FadeMaterial[] = []
  const seen = new Map<Material, Material>()

  root.traverse((o) => {
    const mesh = o as Mesh
    if (!mesh.isMesh) return
    const swap = (m: Material): Material => {
      let c = seen.get(m)
      if (!c) {
        c = m.clone()
        // Screen-space transmission re-renders the whole scene per frame and conflicts with the
        // post-processing buffers. Plain alpha glass looks right here and is far cheaper.
        const phys = c as MeshPhysicalMaterial
        if (phys.isMeshPhysicalMaterial && phys.transmission > 0) {
          phys.transmission = 0
          phys.thickness = 0
          phys.opacity = Math.min(phys.opacity, 0.42)
          phys.transparent = true
          phys.depthWrite = false
        }
        seen.set(m, c)
        const fm = c as FadeMaterial['mat']
        materials.push({ mat: fm, baseOpacity: fm.opacity, baseTransparent: fm.transparent, baseDepthWrite: fm.depthWrite })
      }
      return c
    }
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(swap) : swap(mesh.material)
    mesh.frustumCulled = true
  })

  const box = new Box3().setFromObject(root)
  const size = box.getSize(new Vector3())
  const max = Math.max(size.x, size.y, size.z) || 1
  const scale = MODEL_SIZE / max
  const center = box.getCenter(new Vector3())
  // centre the model on the origin so cameras can orbit around (0,0,0)
  root.position.sub(center)
  const wrapper = new Object3D()
  wrapper.add(root)
  wrapper.scale.setScalar(scale)
  size.multiplyScalar(scale)

  return { root: wrapper, scale, size, materials }
}

let lastOpacity = new WeakMap<PreparedModel, number>()

/** Applies a fade (0..1) to all materials. Cheap no-op when the value did not change. */
export function setModelOpacity(model: PreparedModel, opacity: number) {
  const prev = lastOpacity.get(model)
  if (prev !== undefined && Math.abs(prev - opacity) < 0.002) return
  lastOpacity.set(model, opacity)
  const solid = opacity > 0.995
  for (const f of model.materials) {
    f.mat.opacity = f.baseOpacity * opacity
    f.mat.transparent = solid ? f.baseTransparent : true
    f.mat.depthWrite = solid ? f.baseDepthWrite : false
    f.mat.needsUpdate = false
  }
}

/** Releases GPU resources owned by a prepared model (materials + textures). */
export function disposeModel(model: PreparedModel) {
  for (const f of model.materials) {
    const m = f.mat as unknown as Record<string, unknown>
    for (const key of Object.keys(m)) {
      const v = m[key]
      if (v && (v as Texture).isTexture) (v as Texture).dispose()
    }
    f.mat.dispose()
  }
}

/** Path for an asset id, verified against the mapping. */
export const pathFor = (id: AssetId) => ASSETS[id].path

let loader: GLTFLoader | null = null
const cache = new Map<string, Promise<GLTF>>()

/**
 * Loads (and caches) a glTF. Plain promise API on purpose: a missing / corrupt file rejects here and
 * the caller decides what to show, instead of throwing through React Suspense.
 * Progress is still reported through three's DefaultLoadingManager (used by the loading screen).
 */
export function loadGLTF(path: string): Promise<GLTF> {
  let p = cache.get(path)
  if (!p) {
    if (!loader) {
      loader = new GLTFLoader()
      loader.setMeshoptDecoder(MeshoptDecoder)
    }
    const l = loader
    p = new Promise<GLTF>((resolve, reject) => l.load(path, resolve, undefined, (e) => reject(e instanceof Error ? e : new Error(`Could not load ${path}`))))
    // a failed load must not stay cached forever (the file may be added later)
    p.catch(() => cache.delete(path))
    cache.set(path, p)
  }
  return p
}

/** Warm the cache for a chapter's model (no-op for chapters without one, errors are swallowed). */
export function preloadChapter(index: number) {
  const ch = TIMELINE[index]
  if (ch?.model) loadGLTF(ch.model).catch(() => undefined)
}

/** Releases a chapter's cached glTF and its GPU resources. */
export function clearChapter(index: number) {
  const ch = TIMELINE[index]
  if (!ch?.model) return
  const p = cache.get(ch.model)
  if (!p) return
  cache.delete(ch.model)
  p.then((gltf) => {
    gltf.scene.traverse((o) => {
      const m = o as Mesh
      if (m.isMesh) m.geometry.dispose()
    })
  }).catch(() => undefined)
}
