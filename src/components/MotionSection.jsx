import { memo } from 'react'
import GridDivider from './GridDivider'

function MotionSectionComponent({ items = [], onOpenGallery }) {
  return (
    <section className="dvb-section" id="motion">
      <GridDivider top />

      <div className="dvb-sec-head">
        <h2 className="dvb-sec-title">motion.</h2>
        <p className="dvb-sec-desc">
          3D animations, brand identities, and kinetic typography. click any project to view with sound.
        </p>
      </div>

      <div className="dvb-motion-grid">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="dvb-motion-card group"
            onClick={() => onOpenGallery && onOpenGallery(idx)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onOpenGallery && onOpenGallery(idx)
              }
            }}
            aria-label={`Play ${item.title}`}
          >
            <div className="dvb-motion-preview">
              <video
                src={item.webm}
                poster={item.poster || undefined}
                muted
                loop
                playsInline
                autoPlay
                preload="metadata"
              />
              <div className="dvb-motion-play-badge">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M4 2.5v11l9-5.5-9-5.5z" />
                </svg>
              </div>
            </div>

            <div className="dvb-motion-info">
              <div>
                <h3 className="dvb-motion-title">{item.title}</h3>
                <div className="dvb-motion-tag">{item.tag}</div>
              </div>

              <span className="btn" style={{ padding: '6px 10px', fontSize: '12px' }}>
                <span>play</span>
                <svg
                  width="9"
                  height="9"
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
          </div>
        ))}
      </div>
    </section>
  )
}

export default memo(MotionSectionComponent)
