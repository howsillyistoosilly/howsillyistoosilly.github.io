import { useRef, useEffect, useState, memo, useCallback } from 'react'
import { useLenis } from 'lenis/react'

const X_RANGE = 140
const Y_RANGE = 70

function VideoCardComponent({ title, tag, src, poster, direction = 1 }) {
  const itemRef = useRef(null)
  const trackRef = useRef(null)
  const videoRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  const boundsRef = useRef({ top: 0, height: 0, vh: typeof window !== 'undefined' ? window.innerHeight : 800 })

  // Measure card bounds passively on resize / intersection to prevent layout thrashing inside scroll callback
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

  // IntersectionObserver: Only play video when in viewport to free GPU decoding threads
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
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [updateBounds])

  // Lenis smooth scroll tick: Uses cached absolute element scroll top position
  useLenis((lenis) => {
    const track = trackRef.current
    if (!track || !isVisible) return

    const scrollY = lenis.scroll || window.scrollY
    const { top, height, vh } = boundsRef.current
    const itemOffset = top - scrollY

    // Progress: 0 = entering bottom, 1 = exiting top
    const raw = 1 - (itemOffset + height) / (vh + height)
    const progress = Math.min(Math.max(raw, 0), 1)

    const x = (progress - 0.5) * X_RANGE * direction
    const y = (0.5 - progress) * Y_RANGE

    track.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`
  })

  // 3D Perspective Tilt on Hover
  const handleMouseMove = (e) => {
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    track.style.transform += ` perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`
  }

  const handleMouseLeave = () => {
    // Parallax scroll handler will naturally reset transform on next frame tick
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
          src={src}
          poster={poster}
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

export default memo(VideoCardComponent)
