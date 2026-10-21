import { memo, useEffect, useRef, useState } from 'react'
import './AnimatedGridBackground.css'

const BUCKETS_FG = 32
const BUCKETS_ROSE = 6
const PROXIMITY_RADIUS = 170
const PROXIMITY_RADIUS_SQ = PROXIMITY_RADIUS * PROXIMITY_RADIUS
const CORE_ACCENT_RADIUS = 70
const RIPPLE_SPEED = 380

// Vignette falloff function: smooth illumination in viewport center with gentle fade towards margins
function calcVignette(x, y, w, h) {
  const normX = (x - w / 2) / (0.64 * w)
  const normY = (y - h / 2) / (0.6 * h)
  const dist = Math.hypot(normX, normY)
  if (dist < 0.5) return 1
  if (dist < 1.1) return 1 - (dist - 0.5) / 0.6 * 0.75
  return 0.25
}

function AnimatedGridBackgroundComponent({
  dotSpacing = 24,
  dotRadius = 1.15,
  fgRgb = '247 247 247',
  roseRgb = '251 44 90',
  showGridLines = true,
}) {
  const canvasRef = useRef(null)
  const overlayRef = useRef(null)
  const [crossPositions, setCrossPositions] = useState([])

  // Setup cross positions for the structural grid lines
  useEffect(() => {
    if (!showGridLines) return
    const updateCrosses = () => {
      // 3 horizontal guide levels: 15%, 50%, 85% of viewport
      const yLevels = [15, 50, 85]
      // Columns: left outer, left inner, center, right inner, right outer
      const xLevels = [5, 20, 50, 80, 95]
      const crosses = []
      let id = 0
      for (const y of yLevels) {
        for (const x of xLevels) {
          crosses.push({ id: id++, x, y })
        }
      }
      setCrossPositions(crosses)
    }

    updateCrosses()
    window.addEventListener('resize', updateCrosses)
    return () => window.removeEventListener('resize', updateCrosses)
  }, [showGridLines])

  // Wandering rose crossmark (notdvb signature feature)
  useEffect(() => {
    if (!showGridLines || crossPositions.length === 0) return

    let timer = null
    const crossElements = overlayRef.current?.querySelectorAll('.grid-cross')
    if (!crossElements || crossElements.length === 0) return

    const pickNext = () => {
      const elements = Array.from(overlayRef.current?.querySelectorAll('.grid-cross') || [])
      if (elements.length === 0) return

      const current = elements.find(el => el.hasAttribute('data-rose'))
      const candidates = elements.filter(el => el !== current)
      if (candidates.length === 0) return

      if (current) {
        current.removeAttribute('data-rose')
      }

      const next = candidates[Math.floor(Math.random() * candidates.length)]
      if (next) {
        next.setAttribute('data-rose', 'moved')
      }

      const nextDelay = 2600 + Math.random() * 1600
      timer = window.setTimeout(pickNext, nextDelay)
    }

    timer = window.setTimeout(pickNext, 1200)

    return () => {
      if (timer) window.clearTimeout(timer)
    }
  }, [showGridLines, crossPositions])

  // Main Canvas animation & physics loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let dpr = 1
    let totalDots = 0

    // Typed arrays for high-performance zero-GC particle grid
    let originX = new Float32Array(0)
    let originY = new Float32Array(0)
    let dispX = new Float32Array(0)
    let dispY = new Float32Array(0)
    let velX = new Float32Array(0)
    let velY = new Float32Array(0)
    let springK = new Float32Array(0)
    let phaseOffset = new Float32Array(0)
    let vignette = new Float32Array(0)

    // Mouse tracking & state
    const rawMouse = { x: -9999, y: -9999 }
    const smoothMouse = { x: -9999, y: -9999 }
    let isMouseActive = false
    let cursorActiveWeight = 0
    let lastActiveTime = -100

    // Ripples array (shockwaves on click)
    const ripples = []

    // Time & intro state
    let startTime = performance.now()
    let lastFrameTime = startTime
    let elapsedTime = 0
    let introProgress = prefersReducedMotion ? 1 : 0
    let isVisible = true
    let isTabActive = !document.hidden
    let rafId = 0

    const initGrid = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width || window.innerWidth
      height = rect.height || window.innerHeight
      dpr = Math.min(2, window.devicePixelRatio || 1)

      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const spacing = window.innerWidth < 768 ? Math.max(18, dotSpacing - 4) : dotSpacing
      const cols = Math.ceil(width / spacing) + 1
      const rows = Math.ceil(height / spacing) + 1
      const offsetX = (width - (cols - 1) * spacing) / 2
      const offsetY = (height - (rows - 1) * spacing) / 2

      const count = cols * rows
      totalDots = count

      originX = new Float32Array(count)
      originY = new Float32Array(count)
      dispX = new Float32Array(count)
      dispY = new Float32Array(count)
      velX = new Float32Array(count)
      velY = new Float32Array(count)
      springK = new Float32Array(count)
      phaseOffset = new Float32Array(count)
      vignette = new Float32Array(count)

      let idx = 0
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = offsetX + c * spacing
          const y = offsetY + r * spacing
          originX[idx] = x
          originY[idx] = y
          vignette[idx] = calcVignette(x, y, width, height)

          // Individualized spring speed & multi-frequency wave phase
          const rand = (Math.sin(c * 12.9898 + r * 78.233) * 43758.5453) % 1
          springK[idx] = 0.05 + 0.03 * Math.abs(rand)
          phaseOffset[idx] = Math.abs(rand) * Math.PI * 2
          idx++
        }
      }
    }

    initGrid()

    // Physics step
    const updatePhysics = (dt) => {
      // Smooth cursor lerp
      if (isMouseActive) {
        smoothMouse.x += (rawMouse.x - smoothMouse.x) * 0.25
        smoothMouse.y += (rawMouse.y - smoothMouse.y) * 0.25
      }

      // Cursor active weight ramp
      cursorActiveWeight += ((isMouseActive ? 1 : 0) - cursorActiveWeight) * (isMouseActive ? 0.08 : 0.04)

      // Clean up aged ripples (> 2.0s)
      for (let i = ripples.length - 1; i >= 0; i--) {
        if (elapsedTime - ripples[i].born >= 2.0) {
          ripples.splice(i, 1)
        }
      }

      const hasCursor = cursorActiveWeight > 0.001
      const hasRipples = ripples.length > 0

      for (let i = 0; i < totalDots; i++) {
        const ox = originX[i]
        const oy = originY[i]
        let dx = dispX[i]
        let dy = dispY[i]
        let vx = velX[i]
        let vy = velY[i]
        let targetDx = 0
        let targetDy = 0

        // Repulsive force from cursor
        if (hasCursor) {
          const toCursorX = ox + dx - smoothMouse.x
          const toCursorY = oy + dy - smoothMouse.y
          const distSq = toCursorX * toCursorX + toCursorY * toCursorY

          if (distSq < PROXIMITY_RADIUS_SQ && distSq > 0.01) {
            const dist = Math.sqrt(distSq)
            const ratio = 1 - dist / PROXIMITY_RADIUS
            // Repel away from cursor
            const force = ratio * ratio * 0.28 * cursorActiveWeight
            targetDx = toCursorX * force
            targetDy = toCursorY * force
          }
        }

        // Spring integration
        const k = targetDx || targetDy ? 0.08 : springK[i]
        vx += (targetDx - dx) * k
        vy += (targetDy - dy) * k

        // Shockwaves from clicks/taps
        if (hasRipples) {
          const curX = ox + dx
          const curY = oy + dy
          for (const ripple of ripples) {
            const t = elapsedTime - ripple.born
            const rx = curX - ripple.x
            const ry = curY - ripple.y
            const absX = Math.abs(rx)
            const absY = Math.abs(ry)
            const distWave = Math.max(absX, absY)
            const crest = distWave - RIPPLE_SPEED * t
            const shock = Math.exp(-(crest * crest) / 450) * Math.exp(-2.2 * t) * 7.5

            if (shock > 0.001 && distWave > 0.01) {
              if (absX >= absY) {
                vx += Math.sign(rx) * shock
              } else {
                vy += Math.sign(ry) * shock
              }
            }
          }
        }

        // Friction damping
        vx *= 0.8
        vy *= 0.8
        dx += vx
        dy += vy

        dispX[i] = dx
        dispY[i] = dy
        velX[i] = vx
        velY[i] = vy
      }
    }

    // Render step using Path2D batching (32 FG levels + 6 Accent levels)
    const render = () => {
      ctx.clearRect(0, 0, width, height)

      const bucketsFg = []
      for (let b = 0; b < BUCKETS_FG; b++) bucketsFg[b] = new Path2D()

      const bucketsRose = []
      for (let b = 0; b < BUCKETS_ROSE; b++) bucketsRose[b] = new Path2D()

      const hasCursor = cursorActiveWeight > 0.001
      const centerX = width / 2
      const centerY = height / 2
      const maxRadius = Math.hypot(width, height) * 0.85
      const introRadius = (1 - Math.pow(2, -10 * Math.min(1, introProgress))) * maxRadius

      for (let i = 0; i < totalDots; i++) {
        const ox = originX[i]
        const oy = originY[i]
        const x = ox + dispX[i]
        const y = oy + dispY[i]
        const vig = vignette[i]

        // Ambient undulating wave
        let alpha = 0.35 + 0.55 * (
          0.5 + 0.5 * (
            0.65 * Math.sin(0.012 * y + 0.65 * elapsedTime + phaseOffset[i]) +
            0.35 * Math.sin((x + 0.5 * y) * 0.004 - 0.2 * elapsedTime)
          )
        )

        let accentAlpha = 0

        // Proximity glow & accent color near mouse
        if (hasCursor) {
          const distX = x - smoothMouse.x
          const distY = y - smoothMouse.y
          const distSq = distX * distX + distY * distY

          if (distSq < PROXIMITY_RADIUS_SQ) {
            const dist = Math.sqrt(distSq)
            const ratio = 1 - dist / PROXIMITY_RADIUS
            // Proximity brightness boost
            alpha += 0.55 * ratio * ratio * cursorActiveWeight

            // Core accent glow (< 70px)
            if (dist < CORE_ACCENT_RADIUS) {
              accentAlpha = (1 - dist / CORE_ACCENT_RADIUS) * cursorActiveWeight
            }
          }
        }

        // Intro expanding wave cutoff
        if (introProgress < 1) {
          const distFromCenter = Math.hypot(ox - centerX, oy - centerY)
          const introFade = Math.min(1, Math.max(0, (introRadius - distFromCenter) / 160))
          alpha *= introFade
          accentAlpha *= introFade
        }

        // Final multiplied intensity with vignette
        const finalAlpha = Math.min(1, Math.max(0, alpha * vig))

        // Check if accent rose color is triggered
        const roseBucket = Math.round(accentAlpha * finalAlpha * (BUCKETS_ROSE - 1))
        if (roseBucket > 0) {
          bucketsRose[roseBucket].moveTo(x + dotRadius, y)
          bucketsRose[roseBucket].arc(x, y, dotRadius, 0, Math.PI * 2)
          continue
        }

        const fgBucket = Math.round(finalAlpha * (BUCKETS_FG - 1))
        if (fgBucket > 0) {
          bucketsFg[fgBucket].moveTo(x + dotRadius, y)
          bucketsFg[fgBucket].arc(x, y, dotRadius, 0, Math.PI * 2)
        }
      }

      // Draw all FG buckets in single batch operations
      for (let b = 1; b < BUCKETS_FG; b++) {
        const opacity = (b / (BUCKETS_FG - 1)) * 0.28
        ctx.fillStyle = `rgb(${fgRgb} / ${opacity})`
        ctx.fill(bucketsFg[b])
      }

      // Draw all Rose Accent buckets
      for (let b = 1; b < BUCKETS_ROSE; b++) {
        const opacity = (b / (BUCKETS_ROSE - 1)) * 0.75
        ctx.fillStyle = `rgb(${roseRgb} / ${opacity})`
        ctx.fill(bucketsRose[b])
      }
    }

    // Animation frame tick
    const loop = (now) => {
      rafId = 0
      if (!isVisible || !isTabActive) return

      const dt = Math.min(0.05, (now - lastFrameTime) / 1000)
      lastFrameTime = now
      elapsedTime += dt

      if (introProgress < 1) {
        introProgress = Math.min(1, (now - startTime) / 1400)
      }

      updatePhysics(dt)
      render()

      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)

    // Pointer move listener
    const handlePointerMove = (e) => {
      rawMouse.x = e.clientX
      rawMouse.y = e.clientY
      if (smoothMouse.x < -9000) {
        smoothMouse.x = rawMouse.x
        smoothMouse.y = rawMouse.y
      }
      isMouseActive = true
      lastActiveTime = elapsedTime
    }

    const handlePointerLeave = () => {
      isMouseActive = false
      rawMouse.x = -9999
      rawMouse.y = -9999
    }

    // Pointerdown shockwave ripple listener
    const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, label, [role="button"], form, video, .clink, .chip'
    const handlePointerDown = (e) => {
      if (e.button !== 0 && e.isPrimary === false) return
      if (e.target instanceof Element && e.target.closest(INTERACTIVE_SELECTOR)) return
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        born: elapsedTime,
      })
      if (ripples.length > 8) ripples.shift()
      isMouseActive = true
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    document.addEventListener('pointerleave', handlePointerLeave)
    window.addEventListener('pointerdown', handlePointerDown, { passive: true })

    // Resize observer
    let resizeTimer = null
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimer) cancelAnimationFrame(resizeTimer)
      resizeTimer = requestAnimationFrame(() => {
        initGrid()
        render()
      })
    })
    resizeObserver.observe(canvas)

    // Visibility & Tab switches
    const handleVisibility = () => {
      isTabActive = !document.hidden
      if (isTabActive && !rafId) {
        lastFrameTime = performance.now()
        rafId = requestAnimationFrame(loop)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      if (resizeTimer) cancelAnimationFrame(resizeTimer)
      resizeObserver.disconnect()
      window.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerleave', handlePointerLeave)
      window.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [dotSpacing, dotRadius, fgRgb, roseRgb])

  return (
    <div className="animated-grid-bg-container" aria-hidden="true">
      {/* Interactive Dot Matrix Canvas */}
      <canvas ref={canvasRef} className="animated-grid-canvas" />

      {/* Structural Precision Guidelines & Wandering Cross System */}
      {showGridLines && (
        <div ref={overlayRef} className="grid-overlay">
          <div className="grid-guide-frame">
            {/* Outer and Inner Vertical Lines */}
            <i className="grid-v grid-v-outer" style={{ left: '5%' }} />
            <i className="grid-v" style={{ left: '20%' }} />
            <i className="grid-v" style={{ left: '50%' }} />
            <i className="grid-v" style={{ left: '80%' }} />
            <i className="grid-v grid-v-outer" style={{ left: '95%' }} />

            {/* Horizontal Faded Dividing Rules */}
            <div className="grid-rule" style={{ top: '15%' }} />
            <div className="grid-rule" style={{ top: '50%' }} />
            <div className="grid-rule" style={{ top: '85%' }} />

            {/* Intersection Crosshairs with Wandering Rose Mark */}
            {crossPositions.map((cross) => (
              <span
                key={cross.id}
                className="grid-cross"
                style={{ left: `${cross.x}%`, top: `${cross.y}%` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(AnimatedGridBackgroundComponent)
