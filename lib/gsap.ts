import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let registered = false

/** Registers GSAP plugins exactly once (client only). */
export function registerGsap() {
  if (registered || typeof window === 'undefined') return gsap
  gsap.registerPlugin(ScrollTrigger)
  gsap.defaults({ ease: 'none' })
  // Lenis owns smoothing — avoid GSAP smoothing lag compensation jumps after tab switches.
  gsap.ticker.lagSmoothing(0)
  registered = true
  return gsap
}

export { gsap, ScrollTrigger }
