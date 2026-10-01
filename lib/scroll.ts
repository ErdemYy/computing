import type Lenis from 'lenis'

/** Singleton handle to the Lenis instance so UI (header, timeline) can drive scrolling. */
export const scrollApi: { lenis: Lenis | null } = { lenis: null }

type Target = number | string | HTMLElement

export function scrollTo(target: Target, opts: { immediate?: boolean; duration?: number } = {}) {
  const l = scrollApi.lenis
  if (l) {
    l.scrollTo(target, { immediate: opts.immediate, duration: opts.duration ?? 2.4, lock: false })
    return
  }
  // native fallback (reduced motion without Lenis, or before init)
  if (typeof target === 'number') window.scrollTo({ top: target, behavior: opts.immediate ? 'auto' : 'smooth' })
  else if (typeof target === 'string') document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' })
  else target.scrollIntoView({ behavior: 'smooth' })
}

/** Scrolls to the start of a chapter's track section. */
export function scrollToChapter(id: string, opts?: { immediate?: boolean; duration?: number }) {
  const el = document.querySelector<HTMLElement>(`[data-section="${id}"]`)
  if (el) scrollTo(el.offsetTop + (el.offsetParent ? 0 : 0), opts)
}
