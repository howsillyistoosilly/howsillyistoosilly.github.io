import { useRef, useEffect, useState, memo, useCallback } from 'react'
import { useLenis } from 'lenis/react'

const X_RANGE = 140
const Y_RANGE = 70

function VideoCardComponent({
  id,
  index = 0,
  title,
  tag,
  webm,
  mp4,
  src,
  poster,
  direction = 1,
  onOpenGallery,
  onOpenSeparateTab,
}) {
  const itemRef = useRef(null)
  const trackRef = useRef(null)
  const videoRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  const trackRectRef = useRef({ left: 0, top: 0, width: 1, height: 1 })
  const tiltTarget = useRef({ rotX: 0, rotY: 0, mouseX: 50, mouseY: 50 })
  const tiltCurrent = useRef({ rotX: 0, rotY: 0, mouseX: 50, mouseY: 50 })
  const moveFrameRef = useRef(0)
  const movePointRef = useRef({ x: 50, y: 50 })
  
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
    return () => {
      window.removeEventListener('resize', updateBounds)
      if (moveFrameRef.current) cancelAnimationFrame(moveFrameRef.current)
    }
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

  // Continuous smooth inertia lerp loop during hover
  useEffect(() => {
    if (!isHovered) return

    let animationFrameId
    const loop = () => {
      const cur = tiltCurrent.current
      const tar = tiltTarget.current

      cur.rotX += (tar.rotX - cur.rotX) * 0.1
      cur.rotY += (tar.rotY - cur.rotY) * 0.1
      cur.mouseX += (tar.mouseX - cur.mouseX) * 0.1
      cur.mouseY += (tar.mouseY - cur.mouseY) * 0.1

      const track = trackRef.current
      if (track) {
        track.style.setProperty('--mouse-x', `${cur.mouseX.toFixed(1)}%`)
        track.style.setProperty('--mouse-y', `${cur.mouseY.toFixed(1)}%`)
      }

      const video = videoRef.current
      if (video) {
        video.style.transform = `perspective(1000px) rotateY(${cur.rotY.toFixed(2)}deg) rotateX(${cur.rotX.toFixed(2)}deg) scale3d(1.03, 1.03, 1) translateZ(12px)`
      }

      animationFrameId = requestAnimationFrame(loop)
    }

    animationFrameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animationFrameId)
  }, [isHovered])

  // Decoupled Lenis scroll tick for smooth position parallax
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

  const handleMouseMove = useCallback((e) => {
    const { left, top, width, height } = trackRectRef.current
    movePointRef.current.x = (e.clientX - left) / width
    movePointRef.current.y = (e.clientY - top) / height

    if (moveFrameRef.current) return

    moveFrameRef.current = requestAnimationFrame(() => {
      moveFrameRef.current = 0
      const px = movePointRef.current.x
      const py = movePointRef.current.y

      const x = px - 0.5
      const y = py - 0.5

      tiltTarget.current.rotY = x * 10
      tiltTarget.current.rotX = -y * 10
      tiltTarget.current.mouseX = px * 100
      tiltTarget.current.mouseY = py * 100
    })
  }, [])

  const handleMouseEnter = useCallback(() => {
    if (trackRef.current) {
      const tr = trackRef.current.getBoundingClientRect()
      trackRectRef.current = { left: tr.left, top: tr.top, width: tr.width || 1, height: tr.height || 1 }
    }
    setIsHovered(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    tiltTarget.current = { rotX: 0, rotY: 0, mouseX: 50, mouseY: 50 }

    const video = videoRef.current
    if (video) {
      video.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1) translateZ(0px)'
    }
  }, [])

  const handleCardClick = (e) => {
    // If clicked on popout button, let that handler deal with it
    if (e.target.closest('.reel-card-popout-btn')) return
    if (onOpenGallery) {
      onOpenGallery(index)
    }
  }

  const handlePopoutClick = (e) => {
    e.stopPropagation()
    if (onOpenSeparateTab) {
      onOpenSeparateTab(id || index)
    } else if (typeof window !== 'undefined') {
      const videoParam = id || index
      window.open(`/motion?video=${encodeURIComponent(videoParam)}`, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className={`reel-item reel-item--${direction > 0 ? 'right' : 'left'}`} ref={itemRef}>
      <div 
        className={`reel-track${isHovered ? ' reel-track--hovered' : ''}`}
        ref={trackRef}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        aria-label={`Play ${title} and view all motion videos`}
      >
        <div className="reel-spotlight" />

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

        {/* Interactive Hover Action Overlay */}
        <div className="reel-card-click-overlay">
          <div className="reel-card-cta-group">
            <button className="reel-card-play-btn" type="button" tabIndex={-1}>
              <svg viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Play with Sound & Gallery</span>
            </button>

            <button
              className="reel-card-popout-btn"
              type="button"
              onClick={handlePopoutClick}
              title="Open in separate browser tab ↗"
              aria-label="Open in separate tab"
              tabIndex={-1}
            >
              <svg viewBox="0 0 24 24">
                <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="reel-caption">
          <span className="reel-title">{title}</span>
          <span className="reel-tag">{tag}</span>
        </div>
      </div>
    </div>
  )
}

export default memo(VideoCardComponent)
