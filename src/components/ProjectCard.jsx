import { useRef, memo, useCallback, useEffect } from 'react'

export const Chip = memo(function Chip({ label }) {
  return (
    <span className="chip">
      <span>{label}</span>
    </span>
  )
})

function ProjectCardComponent({ num, type, title, desc, tags, link, linkLabel, proj_screen }) {
  const cardRef = useRef(null)
  const rectRef = useRef({ left: 0, top: 0, width: 1, height: 1 })
  const rafId = useRef(null)

  // Cache card dimensions on enter/resize to eliminate synchronous getBoundingClientRect layout reflows during mousemove
  const updateRect = useCallback(() => {
    if (!cardRef.current) return
    const r = cardRef.current.getBoundingClientRect()
    rectRef.current = { left: r.left, top: r.top, width: r.width || 1, height: r.height || 1 }
  }, [])

  useEffect(() => {
    window.addEventListener('resize', updateRect, { passive: true })
    return () => window.removeEventListener('resize', updateRect)
  }, [updateRect])

  // Zero-reflow mouse move handler using cached rect dimensions
  const handleMouseMove = useCallback((e) => {
    if (rafId.current) return

    const clientX = e.clientX
    const clientY = e.clientY

    rafId.current = requestAnimationFrame(() => {
      rafId.current = null
      const card = cardRef.current
      if (!card) return

      const { left, top, width, height } = rectRef.current
      const x = (clientX - left) / width - 0.5
      const y = (clientY - top) / height - 0.5

      card.style.transform = `perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateZ(10px)`
    })
  }, [])

  const handleMouseEnter = useCallback(() => {
    updateRect()
  }, [updateRect])

  const handleMouseLeave = useCallback(() => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current)
      rafId.current = null
    }
    const card = cardRef.current
    if (!card) return
    card.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px)'
  }, [])

  return (
    <div
      className="proj"
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        willChange: 'transform',
        transformStyle: 'preserve-3d',
      }}
    >
      <div className="proj-num">{num}</div>
      <div className="proj-info">
        <div className="proj-type">{type}</div>
        <div className="proj-title">{title}</div>
        <div className="proj-desc">{desc}</div>
        <div className="proj-tags">
          {tags.map((t) => (
            <Chip key={t} label={t} />
          ))}
        </div>
        <a className="proj-link" href={link} target="_blank" rel="noopener noreferrer">
          {linkLabel}
        </a>
      </div>
      <div className="proj-screen">
        {proj_screen ? (
          <img
            src={proj_screen}
            alt={`${title} screenshot`}
            className="proj-screen-img"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="proj-screen-placeholder">
            <div className="proj-screen-label">screenshot / gif</div>
            <div className="proj-screen-hint">replace with image</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(ProjectCardComponent)
