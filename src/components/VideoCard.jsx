import { useRef, useEffect, useState, memo, useCallback } from 'react'
import { useLenis } from 'lenis/react'

const X_RANGE = 140
const Y_RANGE = 70

function VideoCardComponent({ title, tag, webm, mp4, src, poster, direction = 1 }) {
  const itemRef = useRef(null)
  const trackRef = useRef(null)
  const videoRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  const trackRectRef = useRef({ left: 0, top: 0, width: 1, height: 1 })
  const tiltRafId = useRef(null)
  
  const boundsRef = useRef({ top: 0, height: 0, vh: typeof window !== 'undefined' ? window.innerHeight : 800 })

  const updateBounds = useCallback(() => {
    if (!itemRef.current) return
    const rect = itemRef.current.getBoundingClientRect()
    const scrollY = window.scrollY || window.pageYOffset
    boundsRef.current.top = rect.top + scrollY
    boundsRef.current.height = rect.height
    boundsRef.current.vh = window.innerHeight

    if (trackRef.current) {
      const tr = trackRef.current.getBoundingClientRect()
      trackRectRef.current = { left: tr.left, top: tr.top, width: tr.width || 1, height: tr.height || 1 }
    }
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

  // Decoupled Lenis scroll tick: Updates scroll parallax transform smoothly on wrapper
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

    track.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
  })

  // Zero-reflow hardware 3D Perspective Mouse Hover Tilt
  const handleMouseMove = useCallback((e) => {
    if (tiltRafId.current) return

    const clientX = e.clientX
    const clientY = e.clientY

    tiltRafId.current = requestAnimationFrame(() => {
      tiltRafId.current = null
      const video = videoRef.current
      if (!video) return

      const { left, top, width, height } = trackRectRef.current
      const x = (clientX - left) / width - 0.5
      const y = (clientY - top) / height - 0.5
      
      video.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) scale3d(1.02, 1.02, 1)`
    })
  }, [])

  const handleMouseEnter = useCallback(() => {
    if (trackRef.current) {
      const tr = trackRef.current.getBoundingClientRect()
      trackRectRef.current = { left: tr.left, top: tr.top, width: tr.width || 1, height: tr.height || 1 }
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (tiltRafId.current) {
      cancelAnimationFrame(tiltRafId.current)
      tiltRafId.current = null
    }
    const video = videoRef.current
    if (video) {
      video.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)'
    }
  }, [])

  return (
    <div className={`reel-item reel-item--${direction > 0 ? 'right' : 'left'}`} ref={itemRef}>
      <div 
        className="reel-track" 
        ref={trackRef}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <video
          className="reel-video"
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
          disableRemotePlayback
          preload="metadata"
          poster={poster}
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
