import { Suspense, memo } from 'react'
import { Chip } from './ProjectCard'

const HERO_SKILLS = Object.freeze([
  'unity', 'Motion Graphics', 'Video Editing', 'c#', 'c++', 'blender', 'aseprite', 'level design', 'game jams', 'physics'
])

function HeroSectionComponent({ ControllerModel, controllerGlb }) {
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
        <div className="hero-model">
          <Suspense fallback={<div className="model-placeholder" />}>
            <ControllerModel path={controllerGlb} />
          </Suspense>
        </div>
        <div className="hero-corner">
          <span>open to work · collabs · game jams</span>
          <span>Next Tech Lab · Oct 2024 — Present</span>
        </div>
      </div>
    </div>
  )
}

export default memo(HeroSectionComponent)
