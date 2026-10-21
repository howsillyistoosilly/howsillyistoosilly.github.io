import { memo, useEffect, useRef, useState } from 'react'
import './FigmaBigName.css'

function FigmaBigNameComponent() {
  const wrapRef = useRef(null)
  const nameRef = useRef(null)
  const [dimensions, setDimensions] = useState({ w: 820, h: 140 })
  const [cursorPos, setCursorPos] = useState({ x: -40, y: -40, opacity: 0 })
  const [selBox, setSelBox] = useState({ w: 0, h: 0, opacity: 0 })
  const [isDone, setIsDone] = useState(false)
  const [dimVisible, setDimVisible] = useState(false)
  const [isIdle, setIsIdle] = useState(false)

  // Measure element dimensions dynamically with high precision
  useEffect(() => {
    const measure = () => {
      if (!nameRef.current) return
      const rect = nameRef.current.getBoundingClientRect()
      const w = Math.round(rect.width)
      const h = Math.round(rect.height)
      if (w > 0 && h > 0) {
        setDimensions({ w, h })
      }
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const hasRunRef = useRef(false)

  // Figma cursor selection sequence:
  // 1. Cursor enters at top-left
  // 2. Drags across the text to bottom-right
  // 3. Selection locks with dimension pill [W × H]
  // 4. Cursor stays permanently parked at the bottom of the selection with gentle idle hover
  useEffect(() => {
    let timers = []
    let fallbackTimer = null

    const runSequence = () => {
      if (hasRunRef.current) return
      hasRunRef.current = true
      if (fallbackTimer) clearTimeout(fallbackTimer)

      if (!nameRef.current) return
      const rect = nameRef.current.getBoundingClientRect()
      const w = Math.round(rect.width) || 720
      const h = Math.round(rect.height) || 120
      setDimensions({ w, h })

      // Initial state: cursor ready at top-left origin
      setCursorPos({ x: -20, y: -16, opacity: 0 })
      setSelBox({ w: 0, h: 0, opacity: 0 })
      setIsDone(false)
      setDimVisible(false)
      setIsIdle(false)

      // Step 1: Cursor fades in at top-left corner
      timers.push(
        setTimeout(() => {
          setCursorPos({ x: -14, y: -8, opacity: 1 })
        }, 250)
      )

      // Step 2: Cursor drags diagonally across the name, precisely locked to the bottom-right node
      const targetX = w + 14
      const targetY = h + 8

      timers.push(
        setTimeout(() => {
          setSelBox({ w: w + 28, h: h + 16, opacity: 1 })
          setCursorPos({ x: targetX, y: targetY, opacity: 1 })
        }, 950)
      )

      // Step 3: Selection locks and dimension badge appears at top-right
      timers.push(
        setTimeout(() => {
          setIsDone(true)
          setDimVisible(true)
        }, 1750)
      )

      // Step 4: Cursor stays parked right where it finished, engaging gentle idle micro-hover
      timers.push(
        setTimeout(() => {
          setIsIdle(true)
        }, 2100)
      )
    }

    const handleAppReady = () => {
      if (hasRunRef.current) return
      if (fallbackTimer) clearTimeout(fallbackTimer)
      // Allow 250ms for the loading overlay to dissolve so the user watches the full selection
      timers.push(setTimeout(runSequence, 250))
    }

    window.addEventListener('appready', handleAppReady)

    // Fallback: trigger after 4.5s only if appready was not received
    fallbackTimer = setTimeout(runSequence, 4500)

    return () => {
      window.removeEventListener('appready', handleAppReady)
      if (fallbackTimer) clearTimeout(fallbackTimer)
      timers.forEach(clearTimeout)
    }
  }, [])

  return (
    <div className="figma-hero-name-block">
      {/* Top Kicker - inside the mind of */}
      <div className="figma-kicker">
        <span>inside the mind of</span>
      </div>

      <div ref={wrapRef} className="figma-name-wrap">
        {/* Big Aaah Name Typography (Tall Didone / Cormorant Serif Style) */}
        <h1 ref={nameRef} className="figma-big-name">
          <span className="figma-name-first">ADARSH</span>
          <span className="figma-name-last">SATISH</span>
        </h1>

        {/* Figma Selection Bounding Box (True Figma Blue #0D99FF) */}
        <div
          className={`figma-sel ${isDone ? 'figma-sel--done' : ''}`}
          style={{
            opacity: selBox.opacity,
            width: isDone ? undefined : `${selBox.w}px`,
            height: isDone ? undefined : `${selBox.h}px`,
            transition: isDone
              ? 'none'
              : 'width 0.85s cubic-bezier(0.22, 1, 0.36, 1), height 0.85s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {/* 4 Corner White Square Nodes */}
          <span className="figma-node figma-node--tl" />
          <span className="figma-node figma-node--tr" />
          <span className="figma-node figma-node--bl" />
          <span className="figma-node figma-node--br" />

          {/* Dimension badge [1106 × 241] at top-right */}
          <span
            className={`figma-dim ${dimVisible ? 'figma-dim--visible' : ''}`}
          >
            {dimensions.w} × {dimensions.h}
          </span>
        </div>

        {/* Figma Multiplayer Cursor (True Figma Blue #0D99FF) */}
        {/* Outer anchor maintains the exact final drag coordinates */}
        <div
          className="figma-cursor-anchor"
          style={{
            transform: `translate(${cursorPos.x}px, ${cursorPos.y}px)`,
            opacity: cursorPos.opacity,
            transition: isIdle
              ? 'none'
              : 'transform 0.85s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease',
          }}
        >
          {/* Inner body handles the organic micro idle hover at that exact spot */}
          <div className={`figma-cursor-body ${isIdle ? 'figma-cursor-body--idle' : ''}`}>
            <svg
              viewBox="0 0 22 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Figma arrow cursor with subtle dark stroke */}
              <path
                d="M1.5 1.5L9.5 21.5L13.5 13.5L21.5 9.5L1.5 1.5Z"
                fill="#0D99FF"
                stroke="#0e0e0e"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
            <span className="figma-cursor-label">Adarsh</span>
          </div>
        </div>
      </div>

      {/* Sub-phrase below name */}
      <div className="figma-sub-phrase">
        <span>gameplay programming</span>
        <span className="figma-phrase-sep">·</span>
        <span>shaders</span>
        <span className="figma-phrase-sep">·</span>
        <span>motion design</span>
      </div>
    </div>
  )
}

export default memo(FigmaBigNameComponent)
