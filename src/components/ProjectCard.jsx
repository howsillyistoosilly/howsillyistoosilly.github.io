import { useRef, useEffect, useState, memo, useCallback } from 'react'

export const Chip = memo(function Chip({ label }) {
  return (
    <span className="chip">
      <span>{label}</span>
    </span>
  )
})

function ProjectCardComponent({ num, type, title, desc, tags, link, linkLabel, proj_screen }) {
  const cardRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)
  
  const rectRef = useRef({ left: 0, top: 0, width: 1, height: 1 })
  const tiltTarget = useRef({ rotX: 0, rotY: 0, mouseX: 50, mouseY: 50 })
  const tiltCurrent = useRef({ rotX: 0, rotY: 0, mouseX: 50, mouseY: 50 })

  const updateRect = useCallback(() => {
    if (!cardRef.current) return
    const r = cardRef.current.getBoundingClientRect()
    rectRef.current = { left: r.left, top: r.top, width: r.width || 1, height: r.height || 1 }
  }, [])

  useEffect(() => {
    window.addEventListener('resize', updateRect, { passive: true })
    return () => window.removeEventListener('resize', updateRect)
  }, [updateRect])

  // Continuous smooth inertia lerp loop during hover
  useEffect(() => {
    if (!isHovered) return

    let animationFrameId
    const loop = () => {
      const cur = tiltCurrent.current
      const tar = tiltTarget.current

      cur.rotX += (tar.rotX - cur.rotX) * 0.1
      cur.rotY += (tar.rotY - cur.rotY) * 0.1
      cur.mouseX += (tar.mouseX - cur.mouseX) * 0.1
      cur.mouseY += (tar.mouseY - cur.mouseY) * 0.1

      const card = cardRef.current
      if (card) {
        card.style.setProperty('--mouse-x', `${cur.mouseX.toFixed(1)}%`)
        card.style.setProperty('--mouse-y', `${cur.mouseY.toFixed(1)}%`)
        card.style.transform = `perspective(1000px) rotateY(${cur.rotY.toFixed(2)}deg) rotateX(${cur.rotX.toFixed(2)}deg)`
      }

      animationFrameId = requestAnimationFrame(loop)
    }

    animationFrameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animationFrameId)
  }, [isHovered])

  const handleMouseMove = useCallback((e) => {
    const { left, top, width, height } = rectRef.current
    const px = (e.clientX - left) / width
    const py = (e.clientY - top) / height

    const x = px - 0.5
    const y = py - 0.5

    tiltTarget.current.rotY = x * 8
    tiltTarget.current.rotX = -y * 8
    tiltTarget.current.mouseX = px * 100
    tiltTarget.current.mouseY = py * 100
  }, [])

  const handleMouseEnter = useCallback(() => {
    updateRect()
    setIsHovered(true)
  }, [updateRect])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    tiltTarget.current = { rotX: 0, rotY: 0, mouseX: 50, mouseY: 50 }

    const card = cardRef.current
    if (card) {
      card.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)'
    }
  }, [])

  return (
    <div
      className={`proj${isHovered ? ' proj--hovered' : ''}`}
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="proj-spotlight" />
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
