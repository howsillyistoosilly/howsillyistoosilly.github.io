/* eslint-disable react/no-unknown-property */
import { useEffect, useMemo, useRef, useState, memo } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { useViewport } from '../context/ViewportContext'
import './PixelTrail.css'

const TRAIL_COUNT = 24

// --- Pure GPU Shader --------------------------------------------------

const VERTEX_SHADER = `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const FRAGMENT_SHADER = `
  uniform vec2 uResolution;
  uniform float uGridSize;
  uniform vec3 uPixelColor;
  uniform vec3 uTrail[${TRAIL_COUNT}]; // x: uv.x, y: uv.y, z: alpha/age (1.0 to 0.0)
  uniform float uTrailRadius;

  void main() {
    vec2 screenUv = gl_FragCoord.xy / uResolution;
    vec2 cellCenter = (floor(screenUv * uGridSize) + 0.5) / uGridSize;
    
    vec2 aspect = vec2(uResolution.x / min(uResolution.x, uResolution.y), uResolution.y / min(uResolution.x, uResolution.y));
    vec2 cellCenterAspect = cellCenter * aspect;

    float trailStrength = 0.0;

    for (int i = 0; i < ${TRAIL_COUNT}; i++) {
      vec3 pt = uTrail[i];
      if (pt.z <= 0.001) continue;
      
      vec2 ptAspect = pt.xy * aspect;
      float dist = distance(cellCenterAspect, ptAspect);
      
      float radius = uTrailRadius * (0.4 + 0.6 * pt.z);
      float intensity = smoothstep(radius, 0.0, dist) * pt.z;
      
      trailStrength = max(trailStrength, intensity);
    }

    vec2 cellUv = fract(screenUv * uGridSize);
    float edge = min(min(cellUv.x, 1.0 - cellUv.x), min(cellUv.y, 1.0 - cellUv.y));
    float gridFactor = smoothstep(0.0, 0.04, edge);

    gl_FragColor = vec4(uPixelColor, trailStrength * gridFactor);
  }
`

const GpuTrailMaterial = shaderMaterial(
  {
    uResolution: new THREE.Vector2(),
    uGridSize: 150,
    uPixelColor: new THREE.Color('#ffffff'),
    uTrailRadius: 0.035,
    uTrail: Array.from({ length: TRAIL_COUNT }, () => new THREE.Vector3(0, 0, 0)),
  },
  VERTEX_SHADER,
  FRAGMENT_SHADER
)

function GpuTrailPlane({ gridSize, trailSize, maxAge = 400, pixelColor }) {
  const { width, height } = useThree(s => s.size)
  const viewport = useThree(s => s.viewport)
  const { mouseRef } = useViewport()

  const material = useMemo(() => new GpuTrailMaterial(), [])
  const colorObj = useMemo(() => new THREE.Color(pixelColor), [pixelColor])
  
  const resolutionVec = useMemo(() => {
    return new THREE.Vector2(width * viewport.dpr, height * viewport.dpr)
  }, [width, height, viewport.dpr])

  const trailPointsRef = useRef(
    Array.from({ length: TRAIL_COUNT }, () => ({ x: 0, y: 0, age: 0 }))
  )
  const headIndexRef = useRef(0)
  const lastMouseRef = useRef({ x: -1, y: -1 })

  useFrame((_, delta) => {
    if (!mouseRef.current) return
    const mx = mouseRef.current.x
    const my = mouseRef.current.y

    const decay = delta * (1000 / maxAge)
    const points = trailPointsRef.current

    for (let i = 0; i < TRAIL_COUNT; i++) {
      if (points[i].age > 0) {
        points[i].age = Math.max(0, points[i].age - decay)
      }
    }

    if (Math.abs(mx - lastMouseRef.current.x) > 1 || Math.abs(my - lastMouseRef.current.y) > 1) {
      lastMouseRef.current.x = mx
      lastMouseRef.current.y = my

      const idx = headIndexRef.current
      points[idx].x = mx / window.innerWidth
      points[idx].y = 1 - (my / window.innerHeight)
      points[idx].age = 1.0

      headIndexRef.current = (headIndexRef.current + 1) % TRAIL_COUNT
    }

    const uniforms = material.uniforms.uTrail.value
    for (let i = 0; i < TRAIL_COUNT; i++) {
      uniforms[i].set(points[i].x, points[i].y, points[i].age)
    }
  })

  const scale = Math.max(viewport.width, viewport.height) / 2

  return (
    <mesh scale={[scale, scale, 1]}>
      <planeGeometry args={[2, 2]} />
      <primitive
        object={material}
        uGridSize={gridSize}
        uPixelColor={colorObj}
        uResolution={resolutionVec}
        uTrailRadius={trailSize}
      />
    </mesh>
  )
}

function PixelTrailComponent({
  gridSize = 150,
  trailSize = 0.035,
  maxAge = 400,
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
        <GpuTrailPlane
          gridSize={gridSize}
          trailSize={trailSize}
          maxAge={maxAge}
          pixelColor={color}
        />
      </Canvas>
    </div>
  )
}

export default memo(PixelTrailComponent)
