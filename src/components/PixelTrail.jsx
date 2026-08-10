/* eslint-disable react/no-unknown-property */
import { useEffect, useMemo, useRef, useState, memo } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { shaderMaterial, useTrailTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useViewport } from '../context/ViewportContext'
import './PixelTrail.css'

// --- Shader -----------------------------------------------------------

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
    vec2 screenUv = gl_FragCoord.xy / resolution;
    vec2 cellCenter = (floor(screenUv * gridSize) + 0.5) / gridSize;
    float trailStrength = texture2D(mouseTrail, cellCenter).r;
    
    // Crisp pixel grid outline matching screen UV space
    vec2 cellUv = fract(screenUv * gridSize);
    float edge = min(min(cellUv.x, 1.0 - cellUv.x), min(cellUv.y, 1.0 - cellUv.y));
    float gridFactor = smoothstep(0.0, 0.04, edge);
    
    gl_FragColor = vec4(pixelColor, trailStrength * gridFactor);
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

  const lastMousePos = useRef({ x: -1, y: -1 })

  useFrame(() => {
    if (!mouseRef.current) return
    const mx = mouseRef.current.x
    const my = mouseRef.current.y
    
    // Only invoke trail texture draw when cursor moves > 0.5px to prevent 120Hz canvas flooding
    if (Math.abs(mx - lastMousePos.current.x) > 0.5 || Math.abs(my - lastMousePos.current.y) > 0.5) {
      lastMousePos.current.x = mx
      lastMousePos.current.y = my
      MOVE_PAYLOAD.uv.x = mx / window.innerWidth
      MOVE_PAYLOAD.uv.y = 1 - my / window.innerHeight
      onMove(MOVE_PAYLOAD)
    }
  })

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
        frameloop="always"
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
