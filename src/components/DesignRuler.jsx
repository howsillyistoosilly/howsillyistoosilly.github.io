import { memo, useEffect, useRef, useState, useMemo } from 'react'
import './DesignRuler.css'

function DesignRulerComponent() {
  const [mouseY, setMouseY] = useState(240)
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 900
  )

  // Track window height on resize
  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Mouse move tracking with RAF for 120fps performance
  useEffect(() => {
    let rafId = null

    const handleMouseMove = (e) => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        setMouseY(Math.round(e.clientY))
        rafId = null
      })
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  // Generate tick markers spanning vertically down the full screen height
  const ticks = useMemo(() => {
    const tickList = []
    const maxPx = Math.max(viewportHeight + 200, 2400)
    for (let i = 0; i <= maxPx; i += 10) {
      const isMajor = i % 100 === 0
      const isMedium = !isMajor && i % 50 === 0
      tickList.push({
        val: i,
        posPx: i,
        isMajor,
        isMedium,
      })
    }
    return tickList
  }, [viewportHeight])

  return (
    <aside className="vertical-ruler-wrap" aria-hidden="true">
      {/* Ticks Strip spanning vertically from top to bottom */}
      <div className="vertical-ruler-track">
        {ticks.map((t) => (
          <div
            key={t.val}
            className={`vertical-ruler-tick ${
              t.isMajor
                ? 'vertical-ruler-tick--major'
                : t.isMedium
                ? 'vertical-ruler-tick--med'
                : 'vertical-ruler-tick--min'
            }`}
            style={{ top: `${t.posPx}px` }}
          >
            {t.isMajor && (
              <span className="vertical-ruler-tick-num">{t.val}</span>
            )}
          </div>
        ))}

        {/* Dynamic Hairline Marker tracking cursor Y position */}
        <div
          className="vertical-ruler-cursor-marker"
          style={{ top: `${mouseY}px` }}
        >
          <div className="vertical-ruler-cursor-line" />
        </div>
      </div>
    </aside>
  )
}

export default memo(DesignRulerComponent)
