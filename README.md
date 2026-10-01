# COMPUTING — Bilgisayarın Evrimi

An original, scroll-driven 3D experience about the evolution of the computer, 1820 → 2026.
One fixed WebGL canvas; **scroll is the camera**. Ten chapters (Babbage → UNIVAC → mainframe → Intel 4004 →
Altair → Apple II → IBM PC → Macintosh → network → data center) with their own lighting, atmosphere,
typography and three hand-built transitions. There is no ENIAC chapter and no ENIAC asset.

> Interaction reference only: the experience was inspired by the *feel* of scroll-choreographed WebGL sites.
> No code, branding, copy, imagery or layout from any other site is used.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Three.js · React Three Fiber · drei ·
`@react-three/postprocessing` · GSAP + ScrollTrigger · Lenis · Tailwind CSS 4 (reset only — styling is hand-written CSS)

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # runs the asset check first, then a production build
npm start          # serve the production build
npm run typecheck
```

Useful scripts:

| script | what it does |
|---|---|
| `npm run verify:assets` | fails if `data/assets.ts` points at a file that is not in `public/` (runs before every build) |
| `npm run inspect:models` | prints triangle / mesh / texture stats of every GLB in `public/models` |
| `npm run optimize:models` | rebuilds the optimised GLBs in `public/models` from the untouched originals in `assets-source/` |
| `node scripts/shoot.mjs …` | visual QA: scrolls headless Chromium to `chapter:progress` positions and saves screenshots (needs a running server on `:3100`, see script header) |

## How it works

```
app/                    layout (fonts, SEO metadata), page, globals.css, icon.svg
data/
  timeline.ts           ALL chapter content + camera keyframes + lighting rigs + transitions
  assets.ts             real model paths + attribution fields (single source of truth)
lib/
  experienceState.ts    hot mutable scroll state (`exp`) + tiny UI store for rare changes
  stage.ts              the "director": scroll → camera pose, theme, lights, transition curves
  modelLoader.ts        cached GLTF loader, model normalisation, fading, disposal
  scroll.ts · gsap.ts · performance.ts · audio.ts
hooks/                  useScrollProgress · useTimeline · useReducedMotion
components/
  experience/           ComputerExperience, ScrollController (Lenis+ScrollTrigger), ExperienceOverlay,
                        ChapterContent, TimelineIndicator, LoadingScreen, AudioController, SceneCanvas
  three/                Scene, CameraController, ModelRenderer, Lighting, Environment, ParticleField,
                        NetworkScene, PostProcessing, PulseLines, Extras (circuits, grid, data streams)
  ui/                   Header, ProgressIndicator, About, Credits, Footer
public/models|textures|hdr|audio
```

**Scroll → scene.** `ScrollController` runs Lenis on the GSAP ticker and a master ScrollTrigger that maps
scroll position to `(chapter, local 0..1)` inside a mutable object. Nothing calls `setState` per scroll tick;
React state only changes when the active chapter changes. Every frame the `CameraController` asks
`lib/stage.ts` for the pose: Catmull-Rom through the chapter's camera keys, blended into the next chapter
inside the chapter's transition zone. Because everything is a pure function of scroll position, scrolling
backwards reverses it exactly. Chapter typography is scrubbed by ScrollTrigger timelines on the same scroll
sections (entrance → hold → exit, each element with its own gesture).

**Transitions** (`transition` in `data/timeline.ts`):

1. *Babbage → UNIVAC* (`dissolve`): the mechanical world dissolves, camera breathes back, the room darkens, UNIVAC settles in.
2. *Mainframe → Intel 4004* (`shrink`): the mainframe collapses into a point, the scene goes black, the camera cuts in the dark and dives onto the chip; circuit traces and electric particles light up around it.
3. *Macintosh → network → data center* (`screen`, `flow`): the camera pushes into the Mac screen, the screen becomes a pixel grid (one point cloud),
   the pixels scatter into network nodes, edges and data pulses appear, the nodes give way to the data-center aisle where light streams run between the racks.

## Models

Real files (checked against the file system, mapped in `data/assets.ts`):

| chapter | file |
|---|---|
| Babbage | `babbages_analytical_engine.glb` |
| UNIVAC | `univac_computer.glb` |
| Mainframe | `mainframe_computer.glb` |
| Intel 4004 | `intel4004.glb` |
| Altair 8800 | `altair_8800_and_disk_drive.glb` |
| Apple II | `apple_ii_computer.glb` |
| IBM PC | `ibm_pc.glb` |
| Macintosh | `macintosh_128k.glb` (a full desk scene — the Mac sits on the desk) |
| Data center | `data_center_rack.glb` (instanced into an aisle) |

ENIAC: **no model exists and none is referenced.**

Every model is normalised at load (centred, scaled to a common size) so file units and pivots do not matter.
Per-model display tuning (`scale`, `yaw`, `lift`) lives in `data/assets.ts`.

### Adding / replacing a model

1. Put the GLB in `public/models/` (keep the original in `assets-source/`, run `npm run optimize:models`).
2. Add or edit its entry in `data/assets.ts` (path, creator, source, licence).
3. Point a chapter at it via `asset` in `data/timeline.ts`.
4. `npm run verify:assets` confirms the path exists.

A chapter whose file is missing or broken **does not crash the site**: the text keeps working and a wireframe stand-in is shown.
(Your browser console will still log the network 404 itself — that cannot be silenced from code.)

## Asset attribution & licences

The GLB models are third-party assets (Sketchfab). **Creator names and licences were not supplied with the files**
and are intentionally *not guessed*: `data/assets.ts` marks them `null` and the Credits section renders
“to be confirmed”. Before publishing, open each model's Sketchfab page and fill in `author` and `license`
(many Sketchfab licences, e.g. CC-BY, legally require attribution; some forbid commercial use). Credits are
generated from that file, so there is one place to edit.

## Performance notes

- **Models were optimised** with gltf-transform (meshopt geometry compression, mesh joining/GPU instancing,
  1024 px WebP textures): 140 MB → 5.7 MB total. Originals are kept untouched in `assets-source/` (backup — this folder
  is not served and can be moved out of the repo/OneDrive).
  Before: Babbage 28 MB / 5 729 meshes, UNIVAC 60 MB, Apple II 36 MB. Now each is ≤ 1.7 MB with a handful of draw calls.
- Lazy loading: only the first chapter loads behind the loading screen (real progress from the loading manager);
  neighbours are prefetched when idle; models more than two chapters away are released.
- Quality tiers (`lib/performance.ts`): DPR clamp, particle count, network size, rack count, SMAA/noise/bloom scale with device class;
  a runtime `PerformanceMonitor` steps the tier down if the frame rate drops. Mouse parallax is off on touch devices.
- The canvas stops rendering while the About/Credits sections fully cover it.
- Screen-space *transmission* materials are converted to plain alpha glass (the transmission pass re-renders the scene).
- No HDRI is downloaded: reflections come from a procedural light-former environment.

## Accessibility

`prefers-reduced-motion`: camera travel, parallax, text motion, particles and smooth scrolling are reduced or off; all text stays.
Chapters are semantic `<article>`/`<h2>` blocks in DOM order, controls have `aria-label`s, focus is visible,
the page works at 390 px width with no horizontal overflow.

## Audio

`lib/audio.ts` + `AudioController` are wired up (muted by default, never autoplays, no files required).
Add tracks to `TRACKS` (e.g. gear clicks, tube hum, CRT noise, digital ambience) and a SOUND toggle appears in the header.

## Known limitations

- Creator / licence data for the models is pending (see above).
- The Macintosh model is a furnished room, so the "screen → pixels" zoom is anchored to the Mac's screen coordinates measured from the file
  (`MAC_SCREEN` in `components/three/NetworkScene.tsx`); replacing that model requires re-measuring them.
- Visual QA was done with software-rendered headless Chromium; real-GPU frame-rate numbers were not measured.
