/**
 * Real asset mapping. Paths were resolved against the files that actually exist
 * in /public/models (checked by scripts/verify-assets.mjs on every build).
 *
 * ENIAC has no model and is deliberately absent from the experience.
 *
 * Attribution: these are third-party models (Sketchfab). The creator names and
 * exact licences were NOT supplied with the files, so they are marked as
 * "unverified" instead of being guessed. Fill them in from each model page.
 */

export type AssetId =
  | 'babbage'
  | 'univac'
  | 'mainframe'
  | 'intel4004'
  | 'altair8800'
  | 'apple2'
  | 'ibmpc'
  | 'macintosh128k'
  | 'datacenter'

export interface AssetMeta {
  id: AssetId
  /** Human readable model name */
  name: string
  /** Creator of the 3D model. `null` = not yet verified. */
  author: string | null
  /** Where the model was obtained */
  source: string
  /** Licence of the model. `null` = not yet verified. */
  license: string | null
  /** Public URL of the (optimised) GLB */
  path: string
  /** Display tuning: final size multiplier relative to the normalised model */
  scale: number
  /** Yaw (radians) applied so the model front faces +Z */
  yaw: number
  /** Vertical nudge in normalised units */
  lift: number
}

export const ASSETS: Record<AssetId, AssetMeta> = {
  babbage: {
    id: 'babbage',
    name: "Babbage's Analytical Engine",
    author: null,
    source: 'Sketchfab',
    license: null,
    path: '/models/babbages_analytical_engine.glb',
    scale: 1.55,
    yaw: 0,
    lift: 0,
  },
  univac: {
    id: 'univac',
    name: 'UNIVAC Computer',
    author: null,
    source: 'Sketchfab',
    license: null,
    path: '/models/univac_computer.glb',
    scale: 1.25,
    yaw: 0,
    lift: 0,
  },
  mainframe: {
    id: 'mainframe',
    name: '1960s Mainframe Computer',
    author: null,
    source: 'Sketchfab',
    license: null,
    path: '/models/mainframe_computer.glb',
    scale: 1.2,
    yaw: 0,
    lift: 0,
  },
  intel4004: {
    id: 'intel4004',
    name: 'Intel 4004',
    author: null,
    source: 'Sketchfab',
    license: null,
    path: '/models/intel4004.glb',
    scale: 1.0,
    yaw: 0,
    lift: 0,
  },
  altair8800: {
    id: 'altair8800',
    name: 'Altair 8800 and Disk Drive',
    author: null,
    source: 'Sketchfab',
    license: null,
    path: '/models/altair_8800_and_disk_drive.glb',
    scale: 0.95,
    yaw: 0,
    lift: 0,
  },
  apple2: {
    id: 'apple2',
    name: 'Apple II Computer',
    author: null,
    source: 'Sketchfab',
    license: null,
    path: '/models/apple_ii_computer.glb',
    scale: 0.85,
    yaw: 0,
    lift: 0,
  },
  ibmpc: {
    id: 'ibmpc',
    name: 'IBM PC',
    author: null,
    source: 'Sketchfab',
    license: null,
    path: '/models/ibm_pc.glb',
    scale: 1.0,
    yaw: 0,
    lift: 0,
  },
  macintosh128k: {
    id: 'macintosh128k',
    name: 'Macintosh 128K',
    author: null,
    source: 'Sketchfab',
    license: null,
    path: '/models/macintosh_128k.glb',
    scale: 1.0,
    yaw: -Math.PI / 2,
    lift: 0,
  },
  datacenter: {
    id: 'datacenter',
    name: 'Data Center Rack',
    author: null,
    source: 'Sketchfab',
    license: null,
    path: '/models/data_center_rack.glb',
    scale: 1.0,
    yaw: 0,
    lift: 0,
  },
}

export const ASSET_LIST: AssetMeta[] = Object.values(ASSETS)
