import { memo } from 'react'
import GridDivider from './GridDivider'

function ProjectsSectionComponent({ projects = [] }) {
  return (
    <section className="dvb-section" id="projects">
      <GridDivider top />

      <div className="dvb-sec-head">
        <h2 className="dvb-sec-title">the work.</h2>
        <p className="dvb-sec-desc">
          indie games, custom shaders, and procedural systems. built with Unity, C#, and HLSL.
        </p>
      </div>

      <div className="dvb-work-list">
        {projects.map((project) => (
          <a
            key={project.num}
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            className="dvb-work-row group"
            aria-label={`${project.title} - ${project.type}`}
          >
            <div className="dvb-work-thumb">
              <img
                src={project.proj_screen}
                alt={project.title}
                loading="lazy"
              />
            </div>

            <div className="dvb-work-info">
              <div className="dvb-work-title-wrap">
                <h3 className="dvb-work-title">{project.title}</h3>
                <span className="dvb-work-type">{project.type}</span>
              </div>

              <p className="dvb-work-desc">{project.desc}</p>

              <div className="dvb-work-tags">
                {project.tags.map((tag) => (
                  <span key={tag} className="dvb-microtag">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="dvb-work-action">
              <span className="btn">
                <span>{project.linkLabel || 'check it out'}</span>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M1 9L9 1M9 1H3M9 1V7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

export default memo(ProjectsSectionComponent)
