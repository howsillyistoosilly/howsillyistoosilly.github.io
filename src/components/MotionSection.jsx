import { memo } from 'react'
import GridDivider from './GridDivider'

function MotionSectionComponent({ items = [], onOpenGallery }) {
  return (
    <section className="dvb-section" id="motion">
      <GridDivider top />

      <div className="dvb-sec-head">
        <h2 className="dvb-sec-title">motion.</h2>
        <p className="dvb-sec-desc">selected films · click to watch</p>
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
              <span className="dvb-motion-tag">{item.tag}</span>
              <h3 className="dvb-motion-title">{item.title}</h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default memo(MotionSectionComponent)
