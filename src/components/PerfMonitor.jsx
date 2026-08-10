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
    webgl: { drawCalls: 0, triangles: 0, textures: 0, geometries: 0 },
  })

  const telemetryRef = useRef({
    frames: 0,
    startTime: performance.now(),
    lastFrameTime: performance.now(),
    maxFrameTimeMs: 0,
    drops60Hz: 0,
    drops120Hz: 0,
    recentDeltas: [],
    webgl: { drawCalls: 0, triangles: 0, textures: 0, geometries: 0 },
  })

  useEffect(() => {
    let rafId
    const t = telemetryRef.current

    const tick = (now) => {
      const delta = now - t.lastFrameTime
      t.lastFrameTime = now
      t.frames++

      if (delta > 0 && delta < 1000) {
        t.recentDeltas.push(delta)
        if (t.recentDeltas.length > 300) t.recentDeltas.shift()

        if (delta > 16.67) t.drops60Hz++
        if (delta > 8.33) t.drops120Hz++
        if (delta > t.maxFrameTimeMs) t.maxFrameTimeMs = delta
      }

      // Update state every 250ms
      if (now - t.startTime >= 250) {
        const elapsedSec = (now - t.startTime) / 1000
        const currentFps = Math.round(t.frames / elapsedSec)
        const avgFrameTime = t.recentDeltas.length > 0
          ? (t.recentDeltas.reduce((a, b) => a + b, 0) / t.recentDeltas.length).toFixed(2)
          : (1000 / currentFps).toFixed(2)

        setStats({
          fps: currentFps,
          avgFps: currentFps,
          frameTimeMs: parseFloat(avgFrameTime),
          maxFrameTimeMs: parseFloat(t.maxFrameTimeMs.toFixed(2)),
          frameDrops60Hz: t.drops60Hz,
          frameDrops120Hz: t.drops120Hz,
          totalFrames: t.frames,
          webgl: { ...t.webgl },
        })
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)

    // Expose global helper for easy JSON extraction
    window.__getPerfMetrics = () => ({
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screenResolution: `${window.innerWidth}x${window.innerHeight}`,
      devicePixelRatio: window.devicePixelRatio,
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      metrics: {
        currentFps: stats.fps,
        avgFrameTimeMs: stats.frameTimeMs,
        maxSpikeFrameTimeMs: stats.maxFrameTimeMs,
        frameDrops60Hz: stats.frameDrops60Hz,
        frameDrops120Hz: stats.frameDrops120Hz,
        totalFramesCollected: stats.totalFrames,
        webgl: stats.webgl,
        recentFrameDeltasMs: t.recentDeltas,
      },
    })

    return () => cancelAnimationFrame(rafId)
  }, [stats.fps, stats.frameTimeMs, stats.maxFrameTimeMs, stats.frameDrops60Hz, stats.frameDrops120Hz, stats.totalFrames, stats.webgl])

  const copyJsonMetrics = () => {
    const json = JSON.stringify(window.__getPerfMetrics(), null, 2)
    navigator.clipboard.writeText(json).then(() => {
      alert('Performance Metrics JSON copied to clipboard!')
    }).catch(() => {
      console.log('Performance Metrics JSON:\n', json)
      alert('Copied to Console (check developer tools)')
    })
  }

  const handleWebGLStats = (webglStats) => {
    telemetryRef.current.webgl = webglStats
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
          ⚡ {stats.fps} FPS | {stats.frameTimeMs}ms
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
            📋 Copy JSON
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
            width: '280px',
            fontFamily: 'monospace',
            fontSize: '11px',
            lineHeight: '1.6',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #333', paddingBottom: '4px' }}>
            📊 PERF PROFILER TELEMETRY
          </div>
          <div>FPS: <span style={{ color: '#4caf50' }}>{stats.fps}</span></div>
          <div>Frame Delta: <span>{stats.frameTimeMs} ms</span></div>
          <div>Max Frame Spike: <span style={{ color: stats.maxFrameTimeMs > 20 ? '#f44336' : '#ff9800' }}>{stats.maxFrameTimeMs} ms</span></div>
          <div>Drops (&gt;16.6ms / 60Hz): <span style={{ color: stats.frameDrops60Hz > 0 ? '#f44336' : '#fff' }}>{stats.frameDrops60Hz}</span></div>
          <div>Drops (&gt;8.3ms / 120Hz): <span style={{ color: stats.frameDrops120Hz > 0 ? '#ff9800' : '#fff' }}>{stats.frameDrops120Hz}</span></div>
          
          <div style={{ fontWeight: 'bold', marginTop: '10px', marginBottom: '4px', borderBottom: '1px solid #333', paddingBottom: '2px' }}>
            🎮 WEBGL STATS
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
            📋 Copy JSON Metrics to Send
          </button>
        </div>
      )}
    </>
  )
}

export const PerfMonitor = memo(PerfMonitorComponent)
