import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { Chip } from './ProjectCard'
import './MotionGallery.css'

// Format seconds into MM:SS
function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

export function MotionGalleryComponent({
  videos = [],
  initialVideoIndex = 0,
  initialVideoId = null,
  isModal = false,
  onClose = () => {},
  onNavigateHome = () => {},
  onNavigateToBlog = () => {},
}) {
  // Resolve initial active index by ID or index
  const resolvedInitialIndex = () => {
    if (initialVideoId) {
      const idx = videos.findIndex(
        (v) => v.id === initialVideoId || v.title?.toLowerCase().replace(/\s+/g, '-') === initialVideoId
      )
      if (idx !== -1) return idx
    }
    if (initialVideoIndex >= 0 && initialVideoIndex < videos.length) {
      return initialVideoIndex
    }
    return 0
  }

  const [activeIndex, setActiveIndex] = useState(resolvedInitialIndex)
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.85)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isLooping, setIsLooping] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [bufferedProgress, setBufferedProgress] = useState(0)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [hoverTime, setHoverTime] = useState(null)
  const [hoverPos, setHoverPos] = useState(0)
  const [copiedToast, setCopiedToast] = useState(false)
  const [isPipAvailable, setIsPipAvailable] = useState(false)

  const videoRef = useRef(null)
  const playerContainerRef = useRef(null)
  const scrubTrackRef = useRef(null)
  const hideControlsTimerRef = useRef(null)

  const activeVideo = videos[activeIndex] || videos[0] || {}

  // Check PiP support on mount
  useEffect(() => {
    if (typeof document !== 'undefined' && document.pictureInPictureEnabled) {
      setIsPipAvailable(true)
    }
  }, [])

  // Sync active video ID to URL if standalone or modal
  useEffect(() => {
    if (typeof window === 'undefined') return
    const videoParam = activeVideo.id || activeIndex
    const currentUrl = new URL(window.location.href)
    
    if (isModal) {
      // In modal mode, update search param or history without page reload
      currentUrl.searchParams.set('video', videoParam)
      window.history.replaceState({ modalOpen: true, video: videoParam }, '', currentUrl.toString())
    } else {
      currentUrl.pathname = '/motion'
      currentUrl.searchParams.set('video', videoParam)
      window.history.replaceState({ video: videoParam }, '', currentUrl.toString())
    }

    if (activeVideo.title) {
      document.title = `${activeVideo.title} — Motion & Video Reel`
    }
    return () => {
      document.title = 'howsillyistoosilly — portfolio & blog'
    }
  }, [activeIndex, activeVideo, isModal])

  // Video source change & playback setup
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = 0
    setCurrentTime(0)
    video.playbackRate = playbackRate
    video.volume = volume
    video.muted = isMuted

    // Play with full unmuted audio on track selection
    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true)
        })
        .catch(() => {
          // Autoplay policy fallback: mute and retry if unmuted autoplay was blocked
          setIsPlaying(false)
        })
    }
  }, [activeIndex])

  // Prevent background scroll in modal mode
  useEffect(() => {
    if (!isModal) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isModal])

  // Controls auto-hide timer
  const resetControlsTimer = useCallback(() => {
    setControlsVisible(true)
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current)
    }
    hideControlsTimerRef.current = setTimeout(() => {
      if (isPlaying) {
        setControlsVisible(false)
      }
    }, 2800)
  }, [isPlaying])

  const handleMouseMove = () => {
    resetControlsTimer()
  }

  // Video Event Handlers
  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return
    setCurrentTime(video.currentTime)

    // Calculate buffered range
    if (video.buffered.length > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1)
      const dur = video.duration || 1
      setBufferedProgress(Math.min(bufferedEnd / dur, 1))
    }
  }

  const handleLoadedMetadata = () => {
    const video = videoRef.current
    if (!video) return
    setDuration(video.duration || 0)
    video.volume = volume
    video.muted = isMuted
    video.playbackRate = playbackRate
  }

  const handleVideoEnded = () => {
    if (isLooping) {
      const video = videoRef.current
      if (video) {
        video.currentTime = 0
        video.play().catch(() => {})
      }
    } else {
      // Auto-advance to next video in gallery
      handleNextVideo()
    }
  }

  // Play / Pause Toggle
  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused || video.ended) {
      video.muted = isMuted
      video.volume = volume
      video.play().then(() => setIsPlaying(true)).catch(() => {})
    } else {
      video.pause()
      setIsPlaying(false)
    }
    resetControlsTimer()
  }

  // Volume & Mute Controls
  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value)
    setVolume(newVol)
    const video = videoRef.current
    if (video) {
      video.volume = newVol
      if (newVol > 0 && isMuted) {
        video.muted = false
        setIsMuted(false)
      } else if (newVol === 0 && !isMuted) {
        video.muted = true
        setIsMuted(true)
      }
    }
    resetControlsTimer()
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    const nextMuted = !isMuted
    video.muted = nextMuted
    setIsMuted(nextMuted)
    if (!nextMuted && volume === 0) {
      setVolume(0.5)
      video.volume = 0.5
    }
    resetControlsTimer()
  }

  // Scrubber / Seekbar interaction
  const handleScrubClick = (e) => {
    const track = scrubTrackRef.current
    const video = videoRef.current
    if (!track || !video || !duration) return

    const rect = track.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percent = Math.max(0, Math.min(1, clickX / rect.width))
    video.currentTime = percent * duration
    setCurrentTime(video.currentTime)
    resetControlsTimer()
  }

  const handleScrubMouseMove = (e) => {
    const track = scrubTrackRef.current
    if (!track || !duration) return
    const rect = track.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const percent = Math.max(0, Math.min(1, mouseX / rect.width))
    setHoverTime(percent * duration)
    setHoverPos(percent * 100)
  }

  const handleScrubMouseLeave = () => {
    setHoverTime(null)
  }

  // Speed Toggle
  const handleSpeedToggle = () => {
    const rates = [0.5, 1, 1.25, 1.5, 2]
    const currentRateIdx = rates.indexOf(playbackRate)
    const nextRate = rates[(currentRateIdx + 1) % rates.length]
    setPlaybackRate(nextRate)
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate
    }
    resetControlsTimer()
  }

  // Loop Toggle
  const toggleLoop = () => {
    setIsLooping((prev) => !prev)
    resetControlsTimer()
  }

  // Fullscreen Toggle
  const toggleFullscreen = async () => {
    const container = playerContainerRef.current
    if (!container) return

    if (!document.fullscreenElement) {
      try {
        if (container.requestFullscreen) {
          await container.requestFullscreen()
        } else if (container.webkitRequestFullscreen) {
          await container.webkitRequestFullscreen()
        }
        setIsFullscreen(true)
      } catch (err) {
        console.error('Fullscreen error:', err)
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen()
      }
      setIsFullscreen(false)
    }
    resetControlsTimer()
  }

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  // Picture in Picture
  const togglePip = async () => {
    const video = videoRef.current
    if (!video) return
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else {
        await video.requestPictureInPicture()
      }
    } catch (err) {
      console.error('PiP error:', err)
    }
    resetControlsTimer()
  }

  // Previous / Next Video navigation
  const handlePrevVideo = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : videos.length - 1))
  }

  const handleNextVideo = () => {
    setActiveIndex((prev) => (prev < videos.length - 1 ? prev + 1 : 0))
  }

  const handleSelectVideo = (idx) => {
    if (idx === activeIndex) {
      togglePlay()
    } else {
      setActiveIndex(idx)
    }
  }

  // Pop out into a separate browser tab
  const handlePopoutSeparateTab = () => {
    const videoId = activeVideo.id || activeIndex
    const url = `${window.location.origin}/motion?video=${encodeURIComponent(videoId)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Share / Copy Link
  const handleCopyShareLink = () => {
    const videoId = activeVideo.id || activeIndex
    const url = `${window.location.origin}/motion?video=${encodeURIComponent(videoId)}`
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedToast(true)
        setTimeout(() => setCopiedToast(false), 2500)
      })
    }
  }

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in any input or textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return

      if (e.key === ' ' || e.key === 'k' || e.key === 'K') {
        e.preventDefault()
        togglePlay()
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault()
        toggleMute()
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        toggleFullscreen()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (videoRef.current) {
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5)
          resetControlsTimer()
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        if (videoRef.current) {
          videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 5)
          resetControlsTimer()
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setVolume((v) => {
          const next = Math.min(1, v + 0.1)
          if (videoRef.current) videoRef.current.volume = next
          if (isMuted && next > 0) {
            setIsMuted(false)
            if (videoRef.current) videoRef.current.muted = false
          }
          return next
        })
        resetControlsTimer()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setVolume((v) => {
          const next = Math.max(0, v - 0.1)
          if (videoRef.current) videoRef.current.volume = next
          return next
        })
        resetControlsTimer()
      } else if (e.key === 'Escape') {
        if (isModal && !document.fullscreenElement) {
          onClose()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, toggleMute, toggleFullscreen, duration, isMuted, isModal, onClose, resetControlsTimer])

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  const content = (
    <div className="motion-main">
      {/* Cinema Video Player */}
      <div
        className={`cinema-container${isFullscreen ? ' cinema-container--fullscreen' : ''}`}
        ref={playerContainerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setControlsVisible(false)}
      >
        {/* Audio state badge */}
        <div className={`cinema-audio-badge${isMuted ? ' cinema-audio-badge--muted' : ''}`}>
          <span className="cinema-audio-badge-dot" />
          <span>{isMuted ? 'Muted' : `${Math.round(volume * 100)}% Audio`}</span>
          {!isMuted && isPlaying && (
            <span className="equalizer-anim">
              <span className="equalizer-bar" />
              <span className="equalizer-bar" />
              <span className="equalizer-bar" />
              <span className="equalizer-bar" />
            </span>
          )}
        </div>

        {/* Video Canvas */}
        <div className="cinema-viewport" onClick={togglePlay}>
          <video
            ref={videoRef}
            className="cinema-video"
            src={activeVideo.webm || activeVideo.mp4 || activeVideo.src}
            poster={activeVideo.poster}
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleVideoEnded}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            {activeVideo.webm && <source src={activeVideo.webm} type="video/webm" />}
            {activeVideo.mp4 && <source src={activeVideo.mp4} type="video/mp4" />}
          </video>

          {/* Big Center Splash Button */}
          {!isPlaying && (
            <button
              className="cinema-splash-btn"
              type="button"
              aria-label="Play video"
              onClick={(e) => {
                e.stopPropagation()
                togglePlay()
              }}
            >
              <svg viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          )}
        </div>

        {/* Custom Glassmorphic Controls Bar */}
        <div className={`cinema-controls${!controlsVisible && isPlaying ? ' cinema-controls--hidden' : ''}`}>
          {/* Interactive Scrub Bar */}
          <div
            className="cinema-scrub-container"
            ref={scrubTrackRef}
            onClick={handleScrubClick}
            onMouseMove={handleScrubMouseMove}
            onMouseLeave={handleScrubMouseLeave}
          >
            <div className="cinema-scrub-track">
              <div
                className="cinema-scrub-buffered"
                style={{ width: `${bufferedProgress * 100}%` }}
              />
              <div
                className="cinema-scrub-progress"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="cinema-scrub-thumb" />
              </div>
            </div>

            {/* Hover Tooltip */}
            {hoverTime !== null && (
              <div
                className="cinema-scrub-tooltip"
                style={{ left: `${hoverPos}%` }}
              >
                {formatTime(hoverTime)}
              </div>
            )}
          </div>

          {/* Controls Bottom Row */}
          <div className="cinema-ctrl-row">
            {/* Left Controls: Play/Pause, Prev/Next, Volume, Time */}
            <div className="cinema-ctrl-group">
              {/* Play / Pause */}
              <button
                className="cinema-btn"
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? (
                  <svg viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Prev Video */}
              <button
                className="cinema-btn"
                type="button"
                onClick={handlePrevVideo}
                aria-label="Previous Video"
                title="Previous Video"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>

              {/* Next Video */}
              <button
                className="cinema-btn"
                type="button"
                onClick={handleNextVideo}
                aria-label="Next Video"
                title="Next Video"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>

              {/* Volume Slider & Mute */}
              <div className="cinema-vol-wrap">
                <button
                  className="cinema-btn"
                  type="button"
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                  title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                >
                  {isMuted || volume === 0 ? (
                    <svg viewBox="0 0 24 24">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                    </svg>
                  ) : volume > 0.5 ? (
                    <svg viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24">
                      <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="cinema-vol-slider"
                  aria-label="Volume"
                />
              </div>

              {/* Time display */}
              <div className="cinema-time">
                <span className="cinema-time-cur">{formatTime(currentTime)}</span> / {formatTime(duration)}
              </div>
            </div>

            {/* Right Controls: Keyboard hint, Speed, Loop, PiP, Fullscreen, Pop Out */}
            <div className="cinema-ctrl-group">
              <span className="cinema-kbd-hint">Space / M / F</span>

              {/* Speed Button */}
              <button
                className="cinema-speed-btn"
                type="button"
                onClick={handleSpeedToggle}
                title="Playback Speed"
              >
                {playbackRate}x
              </button>

              {/* Loop Toggle */}
              <button
                className={`cinema-btn${isLooping ? ' cinema-btn--active' : ''}`}
                type="button"
                onClick={toggleLoop}
                aria-label="Toggle Loop"
                title={isLooping ? 'Loop: On' : 'Loop: Off'}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
                </svg>
              </button>

              {/* PiP Button */}
              {isPipAvailable && (
                <button
                  className="cinema-btn"
                  type="button"
                  onClick={togglePip}
                  aria-label="Picture-in-Picture"
                  title="Picture-in-Picture"
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 1.98 2 1.98h18c1.1 0 2-.88 2-1.98V5c0-1.1-.9-2-2-2zm0 16.01H3V4.98h18v14.03z" />
                  </svg>
                </button>
              )}

              {/* Fullscreen Button */}
              <button
                className="cinema-btn"
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
                title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
              >
                {isFullscreen ? (
                  <svg viewBox="0 0 24 24">
                    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-14v3h3v2h-5V5h2z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Details Bar */}
      <div className="motion-info-panel">
        <div className="motion-info-left">
          <div className="motion-info-meta">
            <span className="motion-info-num">{activeVideo.num || `0${activeIndex + 1}`}</span>
            <span className="motion-info-tag">{activeVideo.tag}</span>
          </div>
          <h1 className="motion-info-title">{activeVideo.title}</h1>
          {activeVideo.desc && <p className="motion-info-desc">{activeVideo.desc}</p>}
          {activeVideo.software && activeVideo.software.length > 0 && (
            <div className="motion-info-chips">
              {activeVideo.software.map((sw) => (
                <Chip key={sw} label={sw} />
              ))}
            </div>
          )}
        </div>

        <div className="motion-info-right">
          <button
            className="motion-action-btn"
            type="button"
            onClick={handlePopoutSeparateTab}
            title="Open in separate browser tab"
          >
            <span>pop out tab</span>
            <svg viewBox="0 0 24 24">
              <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
            </svg>
          </button>

          <button
            className="motion-action-btn"
            type="button"
            onClick={handleCopyShareLink}
            title="Copy share link"
          >
            <span>{copiedToast ? 'link copied ✓' : 'share link 🔗'}</span>
          </button>

          {copiedToast && <span className="motion-action-toast">Copied direct link to clipboard!</span>}
        </div>
      </div>

      {/* All-Videos Gallery Grid / Playlist */}
      <section className="motion-gallery-sec">
        <div className="motion-gallery-head">
          <h2 className="motion-gallery-title">
            Motion Reel <em>Gallery</em>
          </h2>
          <span className="motion-gallery-count">
            {videos.length} {videos.length === 1 ? 'project' : 'projects'} · click any to play
          </span>
        </div>

        <div className="motion-playlist-grid">
          {videos.map((vid, idx) => {
            const isActive = idx === activeIndex
            return (
              <button
                key={vid.id || vid.title || idx}
                type="button"
                className={`motion-playlist-card${isActive ? ' motion-playlist-card--active' : ''}`}
                onClick={() => handleSelectVideo(idx)}
              >
                <div className="motion-card-thumb-wrap">
                  <video
                    className="motion-card-thumb-video"
                    src={vid.webm || vid.mp4 || vid.src}
                    poster={vid.poster}
                    muted
                    playsInline
                    preload="metadata"
                  />

                  {isActive && (
                    <div className="motion-card-now-playing-badge">
                      <span className="cinema-audio-badge-dot" />
                      <span>{isPlaying ? 'Playing' : 'Active'}</span>
                      {isPlaying && !isMuted && (
                        <span className="equalizer-anim">
                          <span className="equalizer-bar" />
                          <span className="equalizer-bar" />
                          <span className="equalizer-bar" />
                        </span>
                      )}
                    </div>
                  )}

                  <div className="motion-card-play-overlay">
                    <div className="motion-card-play-icon">
                      <svg viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="motion-card-body">
                  <div className="motion-card-meta">
                    <span className="motion-card-num">{vid.num || `0${idx + 1}`}</span>
                    <span className="motion-card-tag">{vid.tag}</span>
                  </div>
                  <h3 className="motion-card-title">{vid.title}</h3>
                </div>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )

  // In Modal Mode
  if (isModal) {
    return (
      <div
        className="motion-modal-backdrop"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose()
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Motion Video Player & Gallery"
      >
        <div className="motion-modal-container">
          <div className="motion-modal-topbar">
            <div className="motion-modal-title-group">
              <span className="motion-modal-tag">02 — motion</span>
              <h2 className="motion-modal-heading">Cinema Player & Gallery</h2>
            </div>

            <div className="motion-modal-actions">
              <button
                className="motion-modal-btn"
                type="button"
                onClick={handlePopoutSeparateTab}
                title="Open this player in a separate browser tab"
              >
                <span>open in separate tab ↗</span>
              </button>
              <button
                className="motion-modal-close-btn"
                type="button"
                onClick={onClose}
                aria-label="Close"
              >
                ✕ close
              </button>
            </div>
          </div>

          {content}
        </div>
      </div>
    )
  }

  // Standalone Full-Page Mode (e.g. /motion or direct tab)
  return (
    <div className="motion-page">
      <nav className="motion-nav">
        <div className="motion-nav__left">
          <button
            type="button"
            className="motion-nav-brand-btn"
            onClick={onNavigateHome}
          >
            howsillyistoosilly <em>/ motion</em>
          </button>
          <span className="motion-nav__badge">reel & cinema player</span>
        </div>

        <div className="motion-nav__right">
          <button
            type="button"
            className="motion-nav-btn"
            onClick={onNavigateHome}
          >
            <span>← portfolio</span>
          </button>
          <button
            type="button"
            className="motion-nav-btn"
            onClick={onNavigateToBlog}
          >
            <span>blog ↗</span>
          </button>
        </div>
      </nav>

      {content}

      <footer style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.5rem 3rem',
        borderTop: '1px solid var(--line, rgba(255, 255, 255, 0.08))',
        fontSize: '0.68rem',
        letterSpacing: '1px',
        color: 'var(--mid, #888888)',
        textTransform: 'uppercase',
      }}>
        <span>howsillyistoosilly · motion</span>
        <span>© 2026 Adarsh Satish</span>
        <button
          type="button"
          onClick={onNavigateHome}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            font: 'inherit',
            letterSpacing: 'inherit',
            textTransform: 'inherit',
            cursor: 'pointer',
          }}
        >
          howsillyistoosilly.lol ↑
        </button>
      </footer>
    </div>
  )
}

export default memo(MotionGalleryComponent)
