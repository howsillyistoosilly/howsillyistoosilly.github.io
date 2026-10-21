import { memo, useEffect, useRef } from 'react'
import './AnimatedGridBackground.css'

const BUCKETS_FG = 32
const BUCKETS_ROSE = 8
const PROXIMITY_RADIUS = 170
const PROXIMITY_RADIUS_SQ = PROXIMITY_RADIUS * PROXIMITY_RADIUS
const CORE_ACCENT_RADIUS = 70
const RIPPLE_SPEED = 380

const SECTIONS = [
  { id: 'hero', rgb: [251, 44, 90], hex: '#FB2C5A' },
  { id: 'projects', rgb: [255, 51, 102], hex: '#FF3366' },
  { id: 'motion', rgb: [0, 210, 255], hex: '#00D2FF' },
  { id: 'photos', rgb: [16, 185, 129], hex: '#10B981' },
  { id: 'about', rgb: [168, 85, 247], hex: '#A855F7' },
  { id: 'contact', rgb: [245, 158, 11], hex: '#F59E0B' },
]

function rgbToHex(r, g, b) {
  const clamp = (val) => Math.max(0, Math.min(255, Math.round(val)))
  return '#' + [clamp(r), clamp(g), clamp(b)].map(x => x.toString(16).padStart(2, '0')).join('')
}

// Vignette falloff function: smooth illumination in viewport center with gentle fade towards margins
function calcVignette(x, y, w, h) {
  const normX = (x - w / 2) / (0.64 * w)
  const normY = (y - h / 2) / (0.6 * h)
  const dist = Math.hypot(normX, normY)
  if (dist < 0.55) return 1
  if (dist < 1.15) return 1 - ((dist - 0.55) / 0.6) * 0.6
  return 0.4
}

function AnimatedGridBackgroundComponent({
  dotSpacing = 16,
  dotRadius = 1.35,
  roseRgb = '251 44 90',
}) {
  const canvasRef = useRef(null)

  // Interactive crosshair highlight on mouse hover / proximity (replaces random wandering)
  useEffect(() => {
    let crossBounds = []

    const refreshCrosses = () => {
      const elements = Array.from(document.querySelectorAll('.grid-cross'))
      crossBounds = elements.map(el => {
        const rect = el.getBoundingClientRect()
        return {
          el,
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        }
      })
    }

    refreshCrosses()
    window.addEventListener('resize', refreshCrosses, { passive: true })
    window.addEventListener('scroll', refreshCrosses, { passive: true })

    let activeCross = null

    const handlePointerMove = (e) => {
      let nearest = null
      let minDist = 36 // Proximity radius for snapping highlight to crosshair

      for (let i = 0; i < crossBounds.length; i++) {
        const c = crossBounds[i]
        const dist = Math.hypot(e.clientX - c.x, e.clientY - c.y)
        if (dist < minDist) {
          minDist = dist
          nearest = c.el
        }
      }

      if (nearest !== activeCross) {
        if (activeCross) {
          activeCross.removeAttribute('data-rose')
        }
        if (nearest) {
          nearest.setAttribute('data-rose', 'true')
        }
        activeCross = nearest
      }
    }

    const handlePointerLeave = () => {
      if (activeCross) {
        activeCross.removeAttribute('data-rose')
        activeCross = null
      }
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    document.addEventListener('pointerleave', handlePointerLeave)

    return () => {
      if (activeCross) {
        activeCross.removeAttribute('data-rose')
      }
      window.removeEventListener('resize', refreshCrosses)
      window.removeEventListener('scroll', refreshCrosses)
      window.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [])

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

    // Ripples array (shockwaves on click)
    const ripples = []

    // Time & intro state (waits for appready from cat explosion)
    let introStartTime = null
    let customOrigin = null
    let delayIntroTimer = null
    let elapsedTime = 0
    let introProgress = prefersReducedMotion ? 1 : 0
    let isVisible = true
    let isTabActive = !document.hidden
    let rafId = 0

    // Begin startup animation when appready fires from LoadingScreen
    const startIntroWave = (e) => {
      if (introStartTime !== null) return
      introStartTime = performance.now()
      if (e?.detail?.originX && e?.detail?.originY) {
        customOrigin = { x: e.detail.originX, y: e.detail.originY }
      }
      refreshSectionPositions()
    }

    window.addEventListener('appready', startIntroWave)
    if (!prefersReducedMotion) {
      delayIntroTimer = window.setTimeout(startIntroWave, 4500)
    } else {
      startIntroWave()
    }
    // Scroll-interactive wave & continuous color state
    let currentScrollY = typeof window !== 'undefined' ? window.scrollY : 0
    let lastTrackedScrollY = currentScrollY
    let smoothScrollVelocity = 0
    let scrollWavePhase = 0

    // Color interpolation state: smoothly chases continuous scroll color
    let currentRgb = [251, 44, 90]
    let targetRgb = [251, 44, 90]

    // Cache section document positions for continuous, snap-free color blending
    let sectionCache = []
    const refreshSectionPositions = () => {
      sectionCache = SECTIONS.map((sec) => {
        const el = document.getElementById(sec.id)
        if (!el) return { id: sec.id, top: 0, bottom: 0, rgb: sec.rgb, hex: sec.hex }
        const rect = el.getBoundingClientRect()
        const top = rect.top + window.scrollY
        return {
          id: sec.id,
          top,
          bottom: top + rect.height,
          rgb: sec.rgb,
          hex: sec.hex,
        }
      }).sort((a, b) => a.top - b.top)
    }

    // Compute continuous color blend based on exact scroll position (no discrete trigger snapping)
    const computeContinuousScrollColor = (scrollY) => {
      if (sectionCache.length === 0) refreshSectionPositions()
      if (sectionCache.length === 0) return [251, 44, 90]

      const focalY = scrollY + height * 0.35 // Visual focus region in viewport
      if (focalY <= sectionCache[0].top) return sectionCache[0].rgb

      for (let i = 0; i < sectionCache.length - 1; i++) {
        const s1 = sectionCache[i]
        const s2 = sectionCache[i + 1]
        if (focalY >= s1.top && focalY < s2.top) {
          const span = s2.top - s1.top
          const t = span > 0 ? Math.min(1, Math.max(0, (focalY - s1.top) / span)) : 0
          // Smooth Hermite blend
          const smoothT = t * t * (3 - 2 * t)
          return [
            s1.rgb[0] + (s2.rgb[0] - s1.rgb[0]) * smoothT,
            s1.rgb[1] + (s2.rgb[1] - s1.rgb[1]) * smoothT,
            s1.rgb[2] + (s2.rgb[2] - s1.rgb[2]) * smoothT,
          ]
        }
      }
      return sectionCache[sectionCache.length - 1].rgb
    }

    // Scroll listener updates current scroll position
    const handleScroll = () => {
      currentScrollY = window.scrollY || 0
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Optional Lenis listener if active
    let lenisUnsub = null
    const bindLenis = () => {
      if (window.__lenis && !lenisUnsub) {
        lenisUnsub = window.__lenis.on('scroll', (e) => {
          currentScrollY = e.scroll ?? window.scrollY ?? 0
        })
      }
    }
    bindLenis()
    const lenisCheckTimer = window.setTimeout(bindLenis, 250)

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

      refreshSectionPositions()
    }

    initGrid()

    // Physics step
    const updatePhysics = (dt) => {
      // 1. Calculate Instantaneous Scroll Velocity
      const scrollDelta = currentScrollY - lastTrackedScrollY
      lastTrackedScrollY = currentScrollY

      const instantVelocity = dt > 0 ? scrollDelta / dt : 0
      smoothScrollVelocity += (instantVelocity - smoothScrollVelocity) * 0.28

      // When scroll stops, smoothScrollVelocity gently decays to zero
      if (Math.abs(scrollDelta) < 0.25) {
        smoothScrollVelocity *= 0.82
        if (Math.abs(smoothScrollVelocity) < 1.5) {
          smoothScrollVelocity = 0
        }
      }

      const velocityMagnitude = Math.abs(smoothScrollVelocity)

      // 2. Drive the Wave Phase ONLY by scrolling!
      // When scrolling stops (velocity = 0), scrollWavePhase completely freezes (PAUSES).
      if (velocityMagnitude > 0.1) {
        scrollWavePhase += smoothScrollVelocity * dt * 0.007
      }

      // 3. Continuous color tracking based on exact scroll position
      targetRgb = computeContinuousScrollColor(currentScrollY)
      currentRgb[0] += (targetRgb[0] - currentRgb[0]) * 0.12
      currentRgb[1] += (targetRgb[1] - currentRgb[1]) * 0.12
      currentRgb[2] += (targetRgb[2] - currentRgb[2]) * 0.12

      // Synchronize CSS custom property across DOM
      const cr = Math.round(currentRgb[0])
      const cg = Math.round(currentRgb[1])
      const cb = Math.round(currentRgb[2])
      document.documentElement.style.setProperty('--accent-hex', rgbToHex(cr, cg, cb))
      document.documentElement.style.setProperty('--accent-rgb', `${cr} ${cg} ${cb}`)

      // 4. Smooth cursor lerp
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

      // Kinetic inertia drift on scroll: subtle elastic vertical displacement proportional to scroll velocity
      const scrollInertiaY = -Math.sign(smoothScrollVelocity) * Math.min(3.5, velocityMagnitude * 0.006)

      for (let i = 0; i < totalDots; i++) {
        const ox = originX[i]
        const oy = originY[i]
        let dx = dispX[i]
        let dy = dispY[i]
        let vx = velX[i]
        let vy = velY[i]
        let targetDx = 0
        let targetDy = scrollInertiaY

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
            targetDy += toCursorY * force
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

    // Render step using Path2D batching (32 FG levels + 8 Accent levels)
    const render = () => {
      ctx.clearRect(0, 0, width, height)

      const bucketsFg = []
      for (let b = 0; b < BUCKETS_FG; b++) bucketsFg[b] = new Path2D()

      const bucketsRose = []
      for (let b = 0; b < BUCKETS_ROSE; b++) bucketsRose[b] = new Path2D()

      const hasCursor = cursorActiveWeight > 0.001

      // Startup wave origin centered on cat explosion point or Hero name
      let originCenterX = customOrigin ? customOrigin.x : width / 2
      let originCenterY = customOrigin ? customOrigin.y : height / 2
      if (!customOrigin) {
        const nameEl = document.querySelector('.figma-name-huge') || document.querySelector('h1')
        if (nameEl) {
          const rect = nameEl.getBoundingClientRect()
          originCenterX = rect.left + rect.width / 2
          originCenterY = Math.min(height, Math.max(0, rect.top + rect.height / 2))
        }
      }
      const maxRadius = Math.hypot(
        Math.max(originCenterX, width - originCenterX),
        Math.max(originCenterY, height - originCenterY)
      ) + 120
      const introRadius = (1 - Math.pow(2, -8 * Math.min(1, introProgress))) * maxRadius

      // Kinetic energy from scroll velocity (brightens matrix dynamically during fast scroll)
      const scrollKineticEnergy = Math.min(0.35, Math.abs(smoothScrollVelocity) * 0.00035)

      for (let i = 0; i < totalDots; i++) {
        const ox = originX[i]
        const oy = originY[i]
        const x = ox + dispX[i]
        const y = oy + dispY[i]
        const vig = vignette[i]

        // SCROLL-DRIVEN WAVE:
        // Notice that scrollWavePhase only increments when scrolling!
        // When scroll stops, scrollWavePhase is static, so the wave PAUSES completely!
        const wave = 0.65 * Math.sin(0.014 * y + scrollWavePhase + phaseOffset[i]) +
                     0.35 * Math.sin((x + 0.5 * y) * 0.005 + scrollWavePhase * 0.5)

        let alpha = 0.32 + 0.48 * (0.5 + 0.5 * wave) + scrollKineticEnergy

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

        // Startup expanding radial shockwave on load
        if (introProgress < 1) {
          const distFromOrigin = Math.hypot(ox - originCenterX, oy - originCenterY)
          const waveDelta = introRadius - distFromOrigin
          if (waveDelta < 0) {
            // Ahead of expanding wave: resting subtle matrix (never completely blank)
            alpha = Math.min(alpha, 0.16)
            accentAlpha = 0
          } else if (waveDelta < 260) {
            // Luminous crest right on the expanding wave edge
            const crest = 1 - waveDelta / 260
            alpha = Math.max(alpha, 0.55 + crest * 0.45)
            accentAlpha = Math.max(accentAlpha, Math.pow(crest, 0.6) * 0.98)
          }
        }

        // Final multiplied intensity with vignette
        const finalAlpha = Math.min(1, Math.max(0, alpha * vig))

        // Check if accent color is triggered
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

      const cr = Math.round(currentRgb[0])
      const cg = Math.round(currentRgb[1])
      const cb = Math.round(currentRgb[2])

      // Base dots: clear, crisp, tinted with active continuous scroll color
      const baseR = Math.round(cr * 0.65 + 235 * 0.35)
      const baseG = Math.round(cg * 0.65 + 235 * 0.35)
      const baseB = Math.round(cb * 0.65 + 235 * 0.35)

      // Draw all FG buckets in single batch operations
      for (let b = 1; b < BUCKETS_FG; b++) {
        const opacity = (b / (BUCKETS_FG - 1)) * 0.44
        ctx.fillStyle = `rgb(${baseR} ${baseG} ${baseB} / ${opacity})`
        ctx.fill(bucketsFg[b])
      }

      // Draw all Accent buckets in rich saturated continuous section color
      for (let b = 1; b < BUCKETS_ROSE; b++) {
        const opacity = (b / (BUCKETS_ROSE - 1)) * 0.95
        ctx.fillStyle = `rgb(${cr} ${cg} ${cb} / ${opacity})`
        ctx.fill(bucketsRose[b])
      }

      // =====================================================================
      // Ruler-to-Cursor Laser Guide & Connected Dots System (Right-side Ruler)
      // =====================================================================
      if (hasCursor && smoothMouse.x > 0 && smoothMouse.x < width && smoothMouse.y > 0 && smoothMouse.y < height) {
        const rulerX = width
        const targetCursorX = smoothMouse.x
        const targetCursorY = smoothMouse.y

        ctx.save()

        // 1. Soft atmospheric laser beam from right-side ruler to cursor
        ctx.beginPath()
        ctx.moveTo(rulerX, targetCursorY)
        ctx.lineTo(targetCursorX, targetCursorY)
        ctx.strokeStyle = `rgb(${cr} ${cg} ${cb} / ${0.16 * cursorActiveWeight})`
        ctx.lineWidth = 4
        ctx.stroke()

        // 2. High-precision dashed CAD drafting guideline
        ctx.beginPath()
        ctx.setLineDash([5, 6])
        ctx.moveTo(rulerX, targetCursorY)
        ctx.lineTo(targetCursorX, targetCursorY)
        ctx.strokeStyle = `rgb(${cr} ${cg} ${cb} / ${0.5 * cursorActiveWeight})`
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.setLineDash([])

        // 3. Connect dots that align with this horizontal cursor line
        const CONNECT_THRESHOLD_Y = 16
        const connectedDots = []
        const minX = Math.min(targetCursorX, rulerX)
        const maxX = Math.max(targetCursorX, rulerX)

        for (let i = 0; i < totalDots; i++) {
          const dx = originX[i] + dispX[i]
          const dy = originY[i] + dispY[i]
          if (
            Math.abs(dy - targetCursorY) < CONNECT_THRESHOLD_Y &&
            dx >= minX - 10 &&
            dx <= maxX + 10
          ) {
            connectedDots.push({ x: dx, y: dy, distY: Math.abs(dy - targetCursorY) })
          }
        }

        // Sort dots along the X axis from cursor to ruler
        connectedDots.sort((a, b) => a.x - b.x)

        if (connectedDots.length > 0) {
          // Draw connecting laser filament chaining through the aligned dots
          ctx.beginPath()
          ctx.moveTo(targetCursorX, targetCursorY)
          for (let p = 0; p < connectedDots.length; p++) {
            ctx.lineTo(connectedDots[p].x, connectedDots[p].y)
          }
          ctx.lineTo(rulerX, targetCursorY)
          ctx.strokeStyle = `rgb(${cr} ${cg} ${cb} / ${0.4 * cursorActiveWeight})`
          ctx.lineWidth = 1
          ctx.stroke()

          // Illuminate each connected dot along the beam
          for (let p = 0; p < connectedDots.length; p++) {
            const dot = connectedDots[p]
            const proximityFactor = 1 - dot.distY / CONNECT_THRESHOLD_Y
            ctx.beginPath()
            ctx.arc(dot.x, dot.y, dotRadius * 1.85, 0, Math.PI * 2)
            ctx.fillStyle = `rgb(${cr} ${cg} ${cb} / ${0.9 * proximityFactor * cursorActiveWeight})`
            ctx.fill()
          }
        }

        // Target reticle node at cursor
        ctx.beginPath()
        ctx.arc(targetCursorX, targetCursorY, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgb(${cr} ${cg} ${cb} / ${0.85 * cursorActiveWeight})`
        ctx.fill()

        // Emitter node on ruler edge
        ctx.beginPath()
        ctx.arc(rulerX - 2, targetCursorY, 3, 0, Math.PI * 2)
        ctx.fillStyle = `rgb(${cr} ${cg} ${cb} / ${0.95 * cursorActiveWeight})`
        ctx.fill()

        ctx.restore()
      }
    }

    // Animation frame tick
    let lastTime = performance.now()
    const loop = (now) => {
      rafId = 0
      if (!isVisible || !isTabActive) return

      const dt = Math.min(0.05, (now - lastTime) / 1000)
      lastTime = now
      elapsedTime += dt

      if (introStartTime !== null && introProgress < 1) {
        introProgress = Math.min(1, (now - introStartTime) / 1600)
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
    const handleResize = () => {
      if (resizeTimer) cancelAnimationFrame(resizeTimer)
      resizeTimer = requestAnimationFrame(() => {
        initGrid()
        render()
      })
    }
    window.addEventListener('resize', handleResize, { passive: true })

    // Visibility & Tab switches
    const handleVisibility = () => {
      isTabActive = !document.hidden
      if (isTabActive && !rafId) {
        lastTime = performance.now()
        rafId = requestAnimationFrame(loop)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      if (delayIntroTimer) window.clearTimeout(delayIntroTimer)
      if (lenisCheckTimer) window.clearTimeout(lenisCheckTimer)
      if (rafId) cancelAnimationFrame(rafId)
      if (resizeTimer) cancelAnimationFrame(resizeTimer)
      window.removeEventListener('scroll', handleScroll)
      if (lenisUnsub) lenisUnsub()
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerleave', handlePointerLeave)
      window.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('appready', startIntroWave)
    }
  }, [dotSpacing, dotRadius, roseRgb])

  return (
    <div className="animated-grid-bg-container" aria-hidden="true">
      {/* Interactive Dot Matrix Canvas */}
      <canvas ref={canvasRef} className="animated-grid-canvas" />
    </div>
  )
}

export default memo(AnimatedGridBackgroundComponent)
