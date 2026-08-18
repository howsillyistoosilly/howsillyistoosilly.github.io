import { memo, useEffect, useRef } from 'react'
import { Chip } from './ProjectCard'

const HERO_SKILLS = Object.freeze([
  'unity', 'Motion Graphics', 'Video Editing', 'c#', 'c++', 'blender', 'aseprite', 'level design', 'game jams', 'physics'
])

function HalftoneReveal({ primaryPhoto, secondaryPhoto }) {
  const revealRef = useRef(null)
  const frameRef = useRef(0)
  const pointRef = useRef({ x: 50, y: 50 })

  useEffect(() => () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
  }, [])

  const updateRevealPoint = (event) => {
    const el = revealRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    pointRef.current.x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100))
    pointRef.current.y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100))

    if (frameRef.current) return

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0
      const { x, y } = pointRef.current
      el.style.setProperty('--reveal-x', `${x}%`)
      el.style.setProperty('--reveal-y', `${y}%`)
    })
  }

  return (
    <div
      ref={revealRef}
      className="hero-reveal"
      onPointerMove={updateRevealPoint}
    >
      <img
        src={primaryPhoto}
        alt="Adarsh portrait"
        className="hero-reveal__image hero-reveal__image--base"
        loading="eager"
        decoding="async"
      />
      <div className="hero-reveal__top">
        <img
          src={secondaryPhoto}
          alt="Adarsh portrait color"
          className="hero-reveal__image hero-reveal__image--top"
          loading="eager"
          decoding="async"
        />
        <div className="hero-reveal__halftone" />
      </div>
      <div className="hero-reveal__grain" />
    </div>
  )
}

function HeroSectionComponent({ primaryPhoto, secondaryPhoto }) {
  return (
    <div className="hero">
      <div className="hero-left">
        <div>
          <div className="hero-tag">Game Developer · 3D/2D Artist · Unity · C#</div>
          <h1 className="hero-name">Adarsh<br /><em>Satish</em></h1>
          <div className="hero-role">Gameplay Programmer · Level Designer</div>
          <p className="hero-desc">Just being a silly dev making stuff he finds cool and things he finds pretty.</p>
          <div className="chips">
            {HERO_SKILLS.map(t => <Chip key={t} label={t} />)}
          </div>
        </div>
      </div>
      <div className="hero-right">
        <HalftoneReveal primaryPhoto={primaryPhoto} secondaryPhoto={secondaryPhoto} />
        <div className="hero-corner">
          <span>open to work · collabs · game jams</span>
          <span>Next Tech Lab · Oct 2024 — Present</span>
        </div>
      </div>
    </div>
  )
}

export default memo(HeroSectionComponent)
