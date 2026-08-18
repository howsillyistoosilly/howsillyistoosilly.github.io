import { useRef, useEffect, useState, memo, useCallback } from 'react'
import { useLenis } from 'lenis/react'

const X_RANGE = 140
const Y_RANGE = 70

function VideoCardComponent({ title, tag, webm, mp4, src, poster, direction = 1 }) {
  const itemRef = useRef(null)
  const trackRef = useRef(null)
  const videoRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  const trackRectRef = useRef({ left: 0, top: 0, width: 1, height: 1 })
  const tiltTarget = useRef({ rotX: 0, rotY: 0, mouseX: 50, mouseY: 50 })
  const tiltCurrent = useRef({ rotX: 0, rotY: 0, mouseX: 50, mouseY: 50 })
  const rafId = useRef(null)
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

  return (
    <div className={`reel-item reel-item--${direction > 0 ? 'right' : 'left'}`} ref={itemRef}>
      <div 
        className={`reel-track${isHovered ? ' reel-track--hovered' : ''}`}
        ref={trackRef}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
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
        <div className="reel-caption">
          <span className="reel-title">{title}</span>
          <span className="reel-tag">{tag}</span>
        </div>
      </div>
    </div>
  )
}

export default memo(VideoCardComponent)
