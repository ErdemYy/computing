import { setUI } from './experienceState'

/**
 * Audio architecture. Muted by default, never autoplays, and works with zero audio files:
 * a track that is not configured or fails to load is silently ignored.
 *
 * To add sound later, drop files into /public/audio and register them in `TRACKS`:
 *   gear clicks → babbage, vacuum tube hum → univac, CRT noise → altair/apple2/macintosh,
 *   digital ambience → network/ai.
 */
export const TRACKS: Partial<Record<string, string>> = {
  // babbage: '/audio/gear-clicks.mp3',
  // univac: '/audio/tube-hum.mp3',
  // altair: '/audio/crt-noise.mp3',
  // ai: '/audio/digital-ambience.mp3',
}

class AudioController {
  private ctx: AudioContext | null = null
  private muted = true
  private current: { id: string; el: HTMLAudioElement } | null = null
  private cache = new Map<string, HTMLAudioElement | null>()

  get available() {
    return Object.keys(TRACKS).length > 0
  }

  init() {
    setUI({ audioAvailable: this.available, muted: true })
  }

  setMuted(m: boolean) {
    this.muted = m
    setUI({ muted: m })
    if (m) this.current?.el.pause()
    else if (this.current) void this.current.el.play().catch(() => undefined)
  }

  toggle() {
    this.setMuted(!this.muted)
  }

  /** Called when the active chapter changes. */
  setChapter(id: string) {
    const src = TRACKS[id]
    if (!src) {
      this.fadeOut()
      return
    }
    if (this.current?.id === id) return
    this.fadeOut()
    let el = this.cache.get(id)
    if (el === undefined) {
      try {
        el = new Audio(src)
        el.loop = true
        el.preload = 'none'
        el.volume = 0.35
        el.addEventListener('error', () => this.cache.set(id, null))
      } catch {
        el = null
      }
      this.cache.set(id, el)
    }
    if (!el) return
    this.current = { id, el }
    if (!this.muted) void el.play().catch(() => undefined)
  }

  private fadeOut() {
    const c = this.current
    this.current = null
    if (!c) return
    const el = c.el
    const step = () => {
      el.volume = Math.max(0, el.volume - 0.05)
      if (el.volume > 0.001) requestAnimationFrame(step)
      else {
        el.pause()
        el.volume = 0.35
      }
    }
    step()
  }
}

export const audio = new AudioController()
