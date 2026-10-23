import { memo } from 'react'
import GridDivider from './GridDivider'

function VisualsSectionComponent({
  photos = [],
  draggedPhotoId,
  onDragStart,
  onDrop,
  onDragEnd,
}) {
  return (
    <section className="dvb-section" id="photos">
      <GridDivider top />

      <div className="dvb-sec-head dvb-photo-head">
        <h2 className="dvb-sec-title">visuals.</h2>
        <p className="dvb-sec-desc">photography · drag to rearrange</p>
      </div>

      <div className="dvb-photo-grid">
        {photos.map((photo) => (
          <figure
            key={photo.id}
            className={`dvb-photo-item${draggedPhotoId === photo.id ? ' dvb-photo-item--dragging' : ''}`}
            draggable
            onDragStart={onDragStart ? onDragStart(photo.id) : undefined}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop ? onDrop(photo.id) : undefined}
            onDragEnd={onDragEnd}
          >
            <img
              src={photo.src}
              alt={photo.alt}
              loading="lazy"
              decoding="async"
            />
          </figure>
        ))}
      </div>
    </section>
  )
}

export default memo(VisualsSectionComponent)
