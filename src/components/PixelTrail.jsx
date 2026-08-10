/* eslint-disable react/no-unknown-property */
import { useEffect, useMemo, useRef, useState, memo } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { shaderMaterial, useTrailTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useViewport } from '../context/ViewportContext'
import './PixelTrail.css'

// --- Discrete Retro Pixel Block Shader (Direct 1:1 Screen Coordinate Mapping) ---

const VERTEX_SHADER = `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const FRAGMENT_SHADER = `
  uniform vec2 resolution;
  uniform sampler2D mouseTrail;
  uniform float gridSize;
  uniform vec3 pixelColor;

  void main() {
    // Direct screen space UV (0.0 to 1.0 across full viewport)
    vec2 screenUv = gl_FragCoord.xy / resolution;

    // Aspect-ratio square grid cell calculation
    vec2 aspectGrid = vec2(gridSize, gridSize * (resolution.y / resolution.x));
    vec2 cellCenter = (floor(screenUv * aspectGrid) + 0.5) / aspectGrid;

    // Sample trail texture at cell center
    float trailStrength = texture2D(mouseTrail, cellCenter).r;
    gl_FragColor = vec4(pixelColor, trailStrength);
  }
`

const DotMaterial = shaderMaterial(
  {
    resolution: new THREE.Vector2(),
    mouseTrail: null,
    gridSize: 100,
    pixelColor: new THREE.Color('#ffffff'),
  },
  VERTEX_SHADER,
  FRAGMENT_SHADER
)

// Pre-allocated object payload to eliminate garbage collection allocations
const MOVE_PAYLOAD = { uv: { x: 0, y: 0 } }

function TrailPlane({ gridSize, trailSize, maxAge, interpolate, easingFunction, pixelColor }) {
  const { width, height } = useThree(s => s.size)
  const viewport = useThree(s => s.viewport)
  const { mouseRef } = useViewport()

  const material = useMemo(() => new DotMaterial(), [])
  const colorObj = useMemo(() => new THREE.Color(pixelColor), [pixelColor])
  
  const resolutionVec = useMemo(() => {
    return new THREE.Vector2(width * viewport.dpr, height * viewport.dpr)
  }, [width, height, viewport.dpr])

  const [trail, onMove] = useTrailTexture({
    size: 512,
    radius: trailSize,
    maxAge,
    interpolate: interpolate || 0.1,
    ease: easingFunction || (t => t),
  })

  useEffect(() => {
    if (!trail) return
    trail.minFilter = THREE.NearestFilter
    trail.magFilter = THREE.NearestFilter
    trail.wrapS = THREE.ClampToEdgeWrapping
    trail.wrapT = THREE.ClampToEdgeWrapping
  }, [trail])

  // Direct mouse updates using shared ViewportContext for zero-lag 1:1 cursor alignment
  useEffect(() => {
    let rafId
    let lastX = -1
    let lastY = -1

    const updateTrail = () => {
      if (mouseRef.current) {
        const mx = mouseRef.current.x
        const my = mouseRef.current.y
        
        // Only trigger update when cursor actually moves
        if (mx !== lastX || my !== lastY) {
          lastX = mx
          lastY = my
          MOVE_PAYLOAD.uv.x = mx / window.innerWidth
          MOVE_PAYLOAD.uv.y = 1 - (my / window.innerHeight)
          onMove(MOVE_PAYLOAD)
        }
      }
      rafId = requestAnimationFrame(updateTrail)
    }

    rafId = requestAnimationFrame(updateTrail)
    return () => cancelAnimationFrame(rafId)
  }, [onMove, mouseRef])

  if (!trail) return null

  const scale = Math.max(viewport.width, viewport.height) / 2

  return (
    <mesh scale={[scale, scale, 1]}>
      <planeGeometry args={[2, 2]} />
      <primitive
        object={material}
        gridSize={gridSize}
        pixelColor={colorObj}
        resolution={resolutionVec}
        mouseTrail={trail}
      />
    </mesh>
  )
}

function PixelTrailComponent({
  gridSize = 150,
  trailSize = 0.035,
  maxAge = 400,
  interpolate = 8,
  easingFunction = (t) => t,
  color = '#f0f0f0',
}) {
  const [ready, setReady] = useState(false)
  const [isTabVisible, setIsTabVisible] = useState(true)
  const [size, setSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  }))

  useEffect(() => {
    let timer
    const updateSize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }
    const debouncedResize = () => {
      clearTimeout(timer)
      timer = setTimeout(updateSize, 100)
    }
    window.addEventListener('resize', debouncedResize, { passive: true })
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', debouncedResize)
    }
  }, [])

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden)
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const handleCreated = useMemo(() => ({ gl, scene }) => {
    gl.setClearColor(0x000000, 0)
    scene.background = null
    setReady(true)
  }, [])

  return (
    <div className={`pixel-trail-root${ready ? ' pixel-trail-ready' : ''}`}>
      <Canvas
        id="pixel-trail-canvas"
        className="pixel-canvas"
        flat
        frameloop={isTabVisible ? 'always' : 'never'}
        style={{
          background: 'transparent',
          pointerEvents: 'none',
          width: size.width,
          height: size.height,
        }}
        gl={{
          alpha: true,
          antialias: false,
          premultipliedAlpha: false,
          preserveDrawingBuffer: false,
          powerPreference: 'high-performance',
        }}
        onCreated={handleCreated}
      >
        <TrailPlane
          gridSize={gridSize}
          trailSize={trailSize}
          maxAge={maxAge}
          interpolate={interpolate}
          easingFunction={easingFunction}
          pixelColor={color}
        />
      </Canvas>
    </div>
  )
}

export default memo(PixelTrailComponent)
