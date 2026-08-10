import { useRef, useEffect, useState, memo, useCallback } from 'react'
import { useLenis } from 'lenis/react'

const X_RANGE = 140
const Y_RANGE = 70

function VideoCardComponent({ title, tag, webm, mp4, src, poster, direction = 1 }) {
  const itemRef = useRef(null)
  const trackRef = useRef(null)
  const videoRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  
  const boundsRef = useRef({ top: 0, height: 0, vh: typeof window !== 'undefined' ? window.innerHeight : 800 })
  const tiltRef = useRef({ targetRx: 0, targetRy: 0, currentRx: 0, currentRy: 0 })

  const updateBounds = useCallback(() => {
    if (!itemRef.current) return
    const rect = itemRef.current.getBoundingClientRect()
    const scrollY = window.scrollY || window.pageYOffset
    boundsRef.current.top = rect.top + scrollY
    boundsRef.current.height = rect.height
    boundsRef.current.vh = window.innerHeight
  }, [])

  useEffect(() => {
    updateBounds()
    window.addEventListener('resize', updateBounds, { passive: true })
    return () => window.removeEventListener('resize', updateBounds)
  }, [updateBounds])

  useEffect(() => {
    const el = itemRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting)
          if (videoRef.current) {
            if (entry.isIntersecting) {
              updateBounds()
              videoRef.current.play().catch(() => {})
            } else {
              videoRef.current.pause()
            }
          }
        })
      },
      { threshold: 0.05 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [updateBounds])

  useLenis((lenis) => {
    const track = trackRef.current
    if (!track || !isVisible) return

    const scrollY = lenis.scroll || window.scrollY
    const { top, height, vh } = boundsRef.current
    const itemOffset = top - scrollY

    const raw = 1 - (itemOffset + height) / (vh + height)
    const progress = Math.min(Math.max(raw, 0), 1)

    const x = (progress - 0.5) * X_RANGE * direction
    const y = (0.5 - progress) * Y_RANGE

    // Smoothly lerp tilt angles to eliminate mouse hover jitter
    const tilt = tiltRef.current
    tilt.currentRx += (tilt.targetRx - tilt.currentRx) * 0.1
    tilt.currentRy += (tilt.targetRy - tilt.currentRy) * 0.1

    const tiltStr = (Math.abs(tilt.currentRx) > 0.01 || Math.abs(tilt.currentRy) > 0.01)
      ? ` perspective(800px) rotateX(${tilt.currentRx.toFixed(2)}deg) rotateY(${tilt.currentRy.toFixed(2)}deg)`
      : ''

    track.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)${tiltStr}`
  })

  const handleMouseMove = (e) => {
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5

    tiltRef.current.targetRy = x * 8
    tiltRef.current.targetRx = -y * 8
  }

  const handleMouseLeave = () => {
    tiltRef.current.targetRx = 0
    tiltRef.current.targetRy = 0
  }

  return (
    <div className={`reel-item reel-item--${direction > 0 ? 'right' : 'left'}`} ref={itemRef}>
      <div 
        className="reel-track" 
        ref={trackRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <video
          ref={videoRef}
          className="reel-video"
          poster={poster}
          muted
          loop
          playsInline
          preload="metadata"
        >
          {webm && <source src={webm} type="video/webm" />}
          {mp4 && <source src={mp4} type="video/mp4" />}
          {src && <source src={src} />}
        </video>
        <div className="reel-caption">
          <span className="reel-title">{title}</span>
          <span className="reel-tag">{tag}</span>
        </div>
      </div>
    </div>
  )
}

export default memo(VideoCardComponent)
