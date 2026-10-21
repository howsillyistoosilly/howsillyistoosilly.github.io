import { memo, useEffect } from 'react'
import Lenis from 'lenis'

function SmoothScrollComponent() {
  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 2.0,
      syncTouch: true,
      infinite: false,
    })

    // Expose for components and global navigation
    window.__lenis = lenis

    let rafId = 0
    function raf(time) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    // Smooth intercept for all anchor links pointing to page hash targets
    const handleAnchorClick = (e) => {
      const link = e.target.closest('a[href^="#"]')
      if (!link) return
      const hash = link.getAttribute('href')
      if (!hash || hash === '#') return
      const target = document.querySelector(hash)
      if (target) {
        e.preventDefault()
        lenis.scrollTo(target, {
          offset: -30,
          duration: 1.2,
        })
      }
    }

    document.addEventListener('click', handleAnchorClick)

    return () => {
      cancelAnimationFrame(rafId)
      document.removeEventListener('click', handleAnchorClick)
      lenis.destroy()
      window.__lenis = null
    }
  }, [])

  return null
}

export default memo(SmoothScrollComponent)
