import { useRef, memo, useCallback } from 'react'

export const Chip = memo(function Chip({ label }) {
  return (
    <span className="chip">
      <span>{label}</span>
    </span>
  )
})

function ProjectCardComponent({ num, type, title, desc, tags, link, linkLabel, proj_screen }) {
  const cardRef = useRef(null)

  // 120fps GPU 3D Perspective Tilt on Mouse Movement
  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5

    card.style.transform = `perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateZ(10px)`
  }, [])

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current
    if (!card) return
    card.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px)'
  }, [])

  return (
    <div
      className="proj"
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        willChange: 'transform',
        transition: 'transform 0.15s cubic-bezier(0.1, 0.9, 0.2, 1)',
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
