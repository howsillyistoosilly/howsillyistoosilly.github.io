/* eslint-disable react/no-unknown-property */
import { useEffect, useMemo, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { shaderMaterial, useTrailTexture } from '@react-three/drei'
import * as THREE from 'three'
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

  vec2 coverUv(vec2 uv) {
    vec2 s = resolution.xy / max(resolution.x, resolution.y);
    vec2 adjusted = (uv - 0.5) * s + 0.5;
    return clamp(adjusted, 0.0, 1.0);
  }

  void main() {
    vec2 screenUv = gl_FragCoord.xy / resolution;
    vec2 uv = coverUv(screenUv);
    vec2 cellCenter = (floor(uv * gridSize) + 0.5) / gridSize;
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

// --- Scene --------------------------------------------------------------
// Renders a fullscreen quad whose alpha comes from a trail texture that
// fades in around the cursor. Nothing is drawn until that texture exists,
// since sampling it before it's ready can return opaque white for a frame.

function TrailPlane({ gridSize, trailSize, maxAge, interpolate, easingFunction, pixelColor }) {
  const { width, height } = useThree(s => s.size)
  const viewport = useThree(s => s.viewport)

  const material = useMemo(() => new DotMaterial(), [])

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

  useEffect(() => {
    const handlePointerMove = (e) => {
      onMove({
        uv: {
          x: e.clientX / window.innerWidth,
          y: 1 - e.clientY / window.innerHeight,
        },
      })
    }
    window.addEventListener('mousemove', handlePointerMove)
    return () => window.removeEventListener('mousemove', handlePointerMove)
  }, [onMove])

  if (!trail) return null

  const scale = Math.max(viewport.width, viewport.height) / 2

  return (
    <mesh scale={[scale, scale, 1]}>
      <planeGeometry args={[2, 2]} />
      <primitive
        object={material}
        gridSize={gridSize}
        pixelColor={new THREE.Color(pixelColor)}
        resolution={[width * viewport.dpr, height * viewport.dpr]}
        mouseTrail={trail}
      />
    </mesh>
  )
}

// --- Public component -----------------------------------------------------

export default function PixelTrail({
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

  // Drive the canvas size explicitly from the actual viewport dimensions
  // instead of relying on percentage-based CSS, which can resolve against
  // the wrong ancestor and either shrink or overflow the canvas.
  useEffect(() => {
    const updateSize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const handleCreated = ({ gl, scene }) => {
    // Fully transparent clear before the first frame, so there's never
    // an opaque frame while the canvas spins up.
    gl.setClearColor(0x000000, 0)
    scene.background = null
    setReady(true)
  }

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