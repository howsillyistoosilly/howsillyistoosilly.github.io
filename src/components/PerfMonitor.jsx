import { useEffect, useRef, useState, memo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'

// R3F sub-component to collect WebGL render metrics
export const WebGLPerfCollector = memo(function WebGLPerfCollector({ onStats }) {
  const { gl } = useThree()

  useFrame(() => {
    if (!gl || !gl.info) return
    onStats({
      drawCalls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      textures: gl.info.memory.textures,
      geometries: gl.info.memory.geometries,
    })
  })

  return null
})

function PerfMonitorComponent() {
  const [isOpen, setIsOpen] = useState(false)
  const [stats, setStats] = useState({
    fps: 120,
    avgFps: 120,
    frameTimeMs: 8.33,
    maxFrameTimeMs: 8.33,
    frameDrops60Hz: 0, // >16.67ms
    frameDrops120Hz: 0, // >8.33ms
    totalFrames: 0,
    totalSpikesCount: 0,
    webgl: { drawCalls: 0, triangles: 0, textures: 0, geometries: 0 },
  })

  const telemetryRef = useRef({
    startTime: performance.now(),
    lastFrameTime: performance.now(),
    lastIntervalTime: performance.now(),
    frames: 0,
    intervalFrames: 0,
    maxFrameTimeMs: 0,
    drops60Hz: 0,
    drops120Hz: 0,
    recentDeltas: [],
    // Full timeline log from initial page load (captured every 500ms)
    timeline: [],
    // Chronological log of every single spike (>16.6ms) with exact timestamp
    spikesLog: [],
    webgl: { drawCalls: 0, triangles: 0, textures: 0, geometries: 0 },
  })

  useEffect(() => {
    let rafId
    const t = telemetryRef.current
    t.startTime = performance.now()
    t.lastFrameTime = performance.now()
    t.lastIntervalTime = performance.now()

    const tick = (now) => {
      const delta = now - t.lastFrameTime
      t.lastFrameTime = now
      t.frames++
      t.intervalFrames++

      const timeFromStartSec = ((now - t.startTime) / 1000).toFixed(2)

      if (delta > 0 && delta < 1000) {
        t.recentDeltas.push(delta)
        if (t.recentDeltas.length > 500) t.recentDeltas.shift()

        if (delta > 8.33) t.drops120Hz++
        
        if (delta > 16.67) {
          t.drops60Hz++
          // Log individual frame spike with exact timestamp from page load
          t.spikesLog.push({
            timestampSec: `${timeFromStartSec}s`,
            spikeMs: parseFloat(delta.toFixed(2)),
            severity: delta > 33.33 ? 'CRITICAL (>30FPS drop)' : 'MINOR (>60FPS drop)',
          })
          // Limit spikes log to latest 100 entries to keep JSON lightweight
          if (t.spikesLog.length > 100) t.spikesLog.shift()
        }

        if (delta > t.maxFrameTimeMs) {
          t.maxFrameTimeMs = delta
        }
      }

      // Record interval timeline snapshot every 500ms
      if (now - t.lastIntervalTime >= 500) {
        const intervalSec = (now - t.lastIntervalTime) / 1000
        const intervalFps = Math.round(t.intervalFrames / intervalSec)
        const avgDelta = t.recentDeltas.length > 0
          ? parseFloat((t.recentDeltas.reduce((a, b) => a + b, 0) / t.recentDeltas.length).toFixed(2))
          : parseFloat((1000 / Math.max(intervalFps, 1)).toFixed(2))

        t.timeline.push({
          timeSec: `${timeFromStartSec}s`,
          fps: intervalFps,
          avgFrameTimeMs: avgDelta,
        })
        if (t.timeline.length > 200) t.timeline.shift()

        t.lastIntervalTime = now
        t.intervalFrames = 0

        setStats({
          fps: intervalFps,
          avgFps: intervalFps,
          frameTimeMs: avgDelta,
          maxFrameTimeMs: parseFloat(t.maxFrameTimeMs.toFixed(2)),
          frameDrops60Hz: t.drops60Hz,
          frameDrops120Hz: t.drops120Hz,
          totalFrames: t.frames,
          totalSpikesCount: t.spikesLog.length,
          webgl: { ...t.webgl },
        })
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)

    // Expose global helper for easy JSON extraction
    window.__getPerfMetrics = () => ({
      sessionSummary: {
        recordingStartTime: new Date(Date.now() - (performance.now() - t.startTime)).toISOString(),
        totalSessionDurationSec: ((performance.now() - t.startTime) / 1000).toFixed(2) + 's',
        totalFramesRecorded: t.frames,
        overallMaxFrameSpikeMs: parseFloat(t.maxFrameTimeMs.toFixed(2)),
        totalFrameDrops60Hz: t.drops60Hz,
        totalFrameDrops120Hz: t.drops120Hz,
        totalLoggedSpikes: t.spikesLog.length,
        currentFps: stats.fps,
        avgFrameTimeMs: stats.frameTimeMs,
      },
      hardwareEnvironment: {
        userAgent: navigator.userAgent,
        screenResolution: `${window.innerWidth}x${window.innerHeight}`,
        devicePixelRatio: window.devicePixelRatio,
        hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      },
      webglStats: t.webgl,
      chronologicalSpikesLog: t.spikesLog, // Every frame spike >16.6ms with exact timestamp
      timeSeriesTimeline500ms: t.timeline, // 500ms timeline graph from 0s to current time
    })

    return () => cancelAnimationFrame(rafId)
  }, [])

  const copyJsonMetrics = () => {
    const json = JSON.stringify(window.__getPerfMetrics(), null, 2)
    navigator.clipboard.writeText(json).then(() => {
      alert('Full Session Performance JSON copied to clipboard!')
    }).catch(() => {
      console.log('Performance Metrics JSON:\n', json)
      alert('Copied to Console (check developer tools)')
    })
  }

  // Toggle overlay with Shift+P
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        setIsOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <div 
        style={{
          position: 'fixed',
          bottom: '12px',
          right: '12px',
          zIndex: 9999,
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <button
          onClick={() => setIsOpen(prev => !prev)}
          style={{
            background: 'rgba(0,0,0,0.85)',
            color: stats.fps >= 100 ? '#4caf50' : stats.fps >= 50 ? '#ff9800' : '#f44336',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '6px',
            padding: '6px 12px',
            fontFamily: 'monospace',
            fontSize: '12px',
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
          }}
        >
          ⚡ {stats.fps} FPS | {stats.frameTimeMs}ms | Spikes: {stats.totalSpikesCount}
        </button>

        {isOpen && (
          <button
            onClick={copyJsonMetrics}
            style={{
              background: '#2196f3',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontFamily: 'monospace',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            📋 Copy Full Session JSON
          </button>
        )}
      </div>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '50px',
            right: '12px',
            zIndex: 9999,
            background: 'rgba(15, 15, 15, 0.95)',
            color: '#f0f0f0',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '8px',
            padding: '16px',
            width: '300px',
            fontFamily: 'monospace',
            fontSize: '11px',
            lineHeight: '1.6',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #333', paddingBottom: '4px' }}>
            📊 FULL SESSION PERF TELEMETRY
          </div>
          <div>Live FPS: <span style={{ color: '#4caf50' }}>{stats.fps}</span></div>
          <div>Avg Frame Time: <span>{stats.frameTimeMs} ms</span></div>
          <div>Max Frame Spike: <span style={{ color: stats.maxFrameTimeMs > 20 ? '#f44336' : '#ff9800' }}>{stats.maxFrameTimeMs} ms</span></div>
          <div>Logged Spikes (&gt;16.6ms): <span style={{ color: stats.totalSpikesCount > 0 ? '#f44336' : '#4caf50' }}>{stats.totalSpikesCount}</span></div>
          <div>Drops (&gt;8.3ms / 120Hz): <span style={{ color: stats.frameDrops120Hz > 0 ? '#ff9800' : '#fff' }}>{stats.frameDrops120Hz}</span></div>
          <div>Total Recorded Frames: {stats.totalFrames}</div>
          
          <div style={{ fontWeight: 'bold', marginTop: '10px', marginBottom: '4px', borderBottom: '1px solid #333', paddingBottom: '2px' }}>
            🎮 WEBGL METRICS
          </div>
          <div>Draw Calls: {stats.webgl.drawCalls}</div>
          <div>Triangles: {stats.webgl.triangles}</div>
          <div>Textures: {stats.webgl.textures}</div>
          <div>Geometries: {stats.webgl.geometries}</div>

          <button
            onClick={copyJsonMetrics}
            style={{
              marginTop: '12px',
              width: '100%',
              background: '#4caf50',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              padding: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            📋 Copy Full Session JSON Metrics
          </button>
        </div>
      )}
    </>
  )
}

export const PerfMonitor = memo(PerfMonitorComponent)
