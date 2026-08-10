import { useRef } from 'react'
import { useLenis } from 'lenis/react'
import './VideoParallax.css'

// How far each card travels, in px, over its full scroll transit.
const X_RANGE = 140
const Y_RANGE = 70

function ReelItem({ title, tag, src, poster, direction = 1 }) {
  const itemRef = useRef(null)
  const trackRef = useRef(null)

  // Runs on every Lenis scroll tick (i.e. every frame while scrolling),
  // so the parallax stays perfectly synced with the smooth-scroll position
  // instead of lagging behind a native 'scroll' event.
  useLenis(() => {
    const item = itemRef.current
    const track = trackRef.current
    if (!item || !track) return

    const rect = item.getBoundingClientRect()
    const vh = window.innerHeight

    // 0 = card just entering from the bottom, 1 = card has fully exited the top
    const raw = 1 - (rect.top + rect.height) / (vh + rect.height)
    const progress = Math.min(Math.max(raw, 0), 1)

    const x = (progress - 0.5) * X_RANGE * direction
    const y = (0.5 - progress) * Y_RANGE

    track.style.transform = `translate3d(${x}px, ${y}px, 0)`
  })

  return (
    <div className={`reel-item reel-item--${direction > 0 ? 'right' : 'left'}`} ref={itemRef}>
      <div className="reel-track" ref={trackRef}>
        <video
          className="reel-video"
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
        <div className="reel-caption">
          <span className="reel-title">{title}</span>
          <span className="reel-tag">{tag}</span>
        </div>
      </div>
    </div>
  )
}

export default function VideoParallax({ items = [] }) {
  return (
    <div className="reel-list">
      {items.map((item, i) => (
        <ReelItem key={item.title || i} direction={i % 2 === 0 ? 1 : -1} {...item} />
      ))}
    </div>
  )
}