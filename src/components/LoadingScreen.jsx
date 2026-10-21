import { memo, useEffect, useRef, useState } from 'react'
import './LoadingScreen.css'

const CAT_FRAMES = [
  // Frame 0: Both eyes open
  [
    '  /\\_____/\\  ',
    ' /  o   o  \\ ',
    '( ==  ^  == )',
    ' )         ( ',
    '(           )',
    ' (__(__)___) ',
  ],
  // Frame 1: Soft blink
  [
    '  /\\_____/\\  ',
    ' /  -   -  \\ ',
    '( ==  ^  == )',
    ' )         ( ',
    '(           )',
    ' (__(__)___) ',
  ],
  // Frame 2: The Signature Wink with sparkle ✧
  [
    '  /\\_____/\\    ',
    ' /  ^   o  \\  ✧',
    '( ==  ^  == )  ',
    ' )         (   ',
    '(           )  ',
    ' (__(__)___)   ',
  ],
  // Frame 3: Playful smile wink with sparkle ✦
  [
    '  /\\_____/\\    ',
    ' /  -   o  \\  ✦',
    '( ==  w  == )  ',
    ' )         (   ',
    '(           )  ',
    ' (__(__)___)   ',
  ],
  // Frame 4: Happy purr with tail twitch
  [
    '  /\\_____/\\    ',
    ' /  ^   ^  \\  ~',
    '( ==  w  == )/ ',
    ' )         (   ',
    '(           )  ',
    ' (__(__)___)   ',
  ],
]

const FRAME_DURATIONS = [550, 160, 500, 420, 500]

function LoadingScreenComponent({ onComplete, criticalAssets = [] }) {
  const canvasRef = useRef(null)
  const [isFadingOut, setIsFadingOut] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let dpr = 1

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })

    // Track active theme accent from DOM
    const getAccentRgb = () => {
      const prop = getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim()
      if (prop) return prop
      return '251 44 90'
    }

    // Animation phases: 'loading' -> 'morphing_to_dots' -> 'exploding' -> 'done'
    let phase = 'loading'
    let progress = 14
    let currentFrameIdx = 0
    let lastFrameSwitchTime = performance.now()
    let morphStartTime = 0
    let explosionStartTime = 0

    // Particle dot system generated from ASCII characters
    let catDots = []
    let flashRing = null

    // Extract ASCII non-space character coordinates into particles
    const generateDotsFromAscii = (centerX, centerY) => {
      const winkFrame = CAT_FRAMES[2] // The wink frame with sparkle
      const charWidth = 10.5
      const lineHeight = 19
      const totalRows = winkFrame.length
      const totalCols = winkFrame[0].length

      const startX = centerX - (totalCols * charWidth) / 2
      const startY = centerY - (totalRows * lineHeight) / 2 - 16

      const dots = []
      for (let r = 0; r < totalRows; r++) {
        const line = winkFrame[r]
        for (let c = 0; c < line.length; c++) {
          const char = line[c]
          if (char !== ' ') {
            const isSparkle = char === '✧' || char === '✦'
            const isEye = char === 'o' || char === '^' || char === '-'
            const isNose = char === '^' || char === 'w'

            const posX = startX + c * charWidth
            const posY = startY + r * lineHeight

            dots.push({
              char,
              x: posX,
              y: posY,
              baseX: posX,
              baseY: posY,
              vx: 0,
              vy: 0,
              radius: isSparkle ? 3.0 : isEye ? 2.5 : 2.0,
              isSparkle,
              isEye,
              alpha: 1.0,
            })
          }
        }
      }
      return dots
    }

    // Asset Loading Tracker
    let loadedCritical = 0
    const totalCritical = Math.max(1, criticalAssets.length)
    criticalAssets.forEach((src) => {
      if (typeof src === 'string' && src.length > 0) {
        const img = new Image()
        img.src = src
        img.onload = img.onerror = () => {
          loadedCritical++
        }
      } else {
        loadedCritical++
      }
    })

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        // Fonts initialized
      })
    }

    const startTime = performance.now()
    const MIN_LOAD_TIME = 1500 // Guarantees smooth full wink cycle

    let rafId = 0
    let lastTime = performance.now()

    const loop = (now) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000)
      lastTime = now

      ctx.clearRect(0, 0, width, height)

      const centerX = width / 2
      const centerY = height / 2
      const accentRgb = getAccentRgb()

      // =====================================================================
      // Phase 1: Loading & ASCII Winking Animation
      // =====================================================================
      if (phase === 'loading') {
        const elapsed = now - startTime
        const timeRatio = Math.min(1, elapsed / MIN_LOAD_TIME)
        const assetRatio = Math.min(1, loadedCritical / totalCritical)
        progress = Math.min(100, Math.round(timeRatio * 70 + assetRatio * 30))

        // Cycle through ASCII cat frames
        const frameDuration = FRAME_DURATIONS[currentFrameIdx] || 400
        if (now - lastFrameSwitchTime > frameDuration) {
          currentFrameIdx = (currentFrameIdx + 1) % CAT_FRAMES.length
          lastFrameSwitchTime = now
        }

        // Draw ASCII Cat Text
        const currentFrame = CAT_FRAMES[currentFrameIdx]
        const lineHeight = 19
        const totalRows = currentFrame.length
        const startY = centerY - (totalRows * lineHeight) / 2 - 16

        ctx.font = '15px "DM Mono", monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        for (let r = 0; r < totalRows; r++) {
          const line = currentFrame[r]
          const y = startY + r * lineHeight

          // Check if line contains sparkle
          if (line.includes('✧') || line.includes('✦')) {
            const parts = line.split(/(✧|✦)/)
            const fullWidth = ctx.measureText(line).width
            let curX = centerX - fullWidth / 2

            for (const part of parts) {
              const partWidth = ctx.measureText(part).width
              ctx.textAlign = 'left'
              if (part === '✧' || part === '✦') {
                ctx.fillStyle = `rgb(${accentRgb})`
                ctx.shadowColor = `rgb(${accentRgb})`
                ctx.shadowBlur = 10
                ctx.fillText(part, curX, y)
                ctx.shadowBlur = 0
              } else {
                ctx.fillStyle = '#f5f5f5'
                ctx.fillText(part, curX, y)
              }
              curX += partWidth
            }
          } else {
            ctx.textAlign = 'center'
            ctx.fillStyle = '#f5f5f5'
            ctx.fillText(line, centerX, y)
          }
        }

        // Minimalist ASCII Progress Bar beneath cat
        const barLength = 20
        const filled = Math.round((progress / 100) * barLength)
        const empty = Math.max(0, barLength - filled)
        const barStr = '[' + '='.repeat(Math.max(0, filled - 1)) + (filled > 0 ? (progress >= 100 ? '=' : '>') : '') + ' '.repeat(empty) + '] ' + progress + '%'

        ctx.font = '12px "DM Mono", monospace'
        ctx.textAlign = 'center'
        ctx.fillStyle = `rgb(${accentRgb})`
        ctx.shadowColor = `rgb(${accentRgb} / 0.4)`
        ctx.shadowBlur = 6
        ctx.fillText(barStr, centerX, centerY + 80)
        ctx.shadowBlur = 0

        // When 100% is reached and time elapsed, transition to dots
        if (progress >= 100 && elapsed >= MIN_LOAD_TIME) {
          phase = 'morphing_to_dots'
          morphStartTime = now
          catDots = generateDotsFromAscii(centerX, centerY)
        }
      }

      // =====================================================================
      // Phase 2: Morphing ASCII Glyphs into Glowing Dots
      // =====================================================================
      else if (phase === 'morphing_to_dots') {
        const morphDuration = 220
        const morphProgress = Math.min(1, (now - morphStartTime) / morphDuration)

        // Draw each character turning into a clean glowing circular dot
        for (let i = 0; i < catDots.length; i++) {
          const dot = catDots[i]
          ctx.beginPath()
          ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2)

          if (dot.isSparkle) {
            ctx.fillStyle = `rgb(${accentRgb})`
            ctx.shadowColor = `rgb(${accentRgb})`
            ctx.shadowBlur = 8
            ctx.fill()
            ctx.shadowBlur = 0
          } else {
            const r = Math.round(251 * morphProgress + 245 * (1 - morphProgress))
            const g = Math.round(44 * morphProgress + 245 * (1 - morphProgress))
            const b = Math.round(90 * morphProgress + 245 * (1 - morphProgress))
            ctx.fillStyle = `rgb(${r} ${g} ${b} / ${0.6 + 0.4 * morphProgress})`
            ctx.fill()
          }
        }

        // Trigger explosion when morphing completes
        if (morphProgress >= 1) {
          phase = 'exploding'
          explosionStartTime = now
          flashRing = { radius: 2, alpha: 1.0 }

          // Give all cat dots explosive radial velocity outward in 360 degrees
          for (let i = 0; i < catDots.length; i++) {
            const dot = catDots[i]
            const angle = Math.atan2(dot.y - centerY, dot.x - centerX) + (Math.random() - 0.5) * 0.45
            const speed = 280 + Math.random() * 560
            dot.vx = Math.cos(angle) * speed
            dot.vy = Math.sin(angle) * speed
          }

          // Trigger the canvas startup shockwave directly from the cat's explosion point!
          window.dispatchEvent(
            new CustomEvent('appready', {
              detail: { originX: centerX, originY: centerY },
            })
          )

          // Smoothly dissolve loader background overlay
          setIsFadingOut(true)
        }
      }

      // =====================================================================
      // Phase 3: The Explosion Blast
      // =====================================================================
      else if (phase === 'exploding') {
        const explosionDuration = 650
        const explosionProgress = Math.min(1, (now - explosionStartTime) / explosionDuration)

        // Expanding shockwave flash ring
        if (flashRing) {
          flashRing.radius += dt * 850
          flashRing.alpha = Math.max(0, 1 - flashRing.radius / (width * 0.6))

          ctx.beginPath()
          ctx.arc(centerX, centerY, flashRing.radius, 0, Math.PI * 2)
          ctx.strokeStyle = `rgb(${accentRgb} / ${flashRing.alpha * 0.55})`
          ctx.lineWidth = Math.max(1, 3 * (1 - explosionProgress))
          ctx.stroke()
        }

        // Draw exploding cat dots scattering outward
        let livingDots = 0
        for (let i = 0; i < catDots.length; i++) {
          const dot = catDots[i]
          dot.x += dot.vx * dt
          dot.y += dot.vy * dt
          dot.vx *= 0.94
          dot.vy *= 0.94
          dot.alpha = Math.max(0, 1 - explosionProgress * 1.3)

          if (dot.alpha > 0.01) {
            livingDots++
            ctx.beginPath()
            ctx.arc(dot.x, dot.y, dot.radius * (1 + explosionProgress * 0.8), 0, Math.PI * 2)
            ctx.fillStyle = `rgb(${accentRgb} / ${dot.alpha})`
            ctx.shadowColor = `rgb(${accentRgb} / ${dot.alpha * 0.8})`
            ctx.shadowBlur = 6
            ctx.fill()
            ctx.shadowBlur = 0
          }
        }

        if (explosionProgress >= 1 || livingDots === 0) {
          phase = 'done'
          if (onComplete) {
            setTimeout(onComplete, 120)
          }
        }
      }

      if (phase !== 'done') {
        rafId = requestAnimationFrame(loop)
      }
    }

    rafId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
    }
  }, [criticalAssets, onComplete])

  return (
    <div
      className={`dvb-loader-overlay ${isFadingOut ? 'dvb-loader-overlay--fade' : ''}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="dvb-loader-canvas" />
    </div>
  )
}

export default memo(LoadingScreenComponent)
