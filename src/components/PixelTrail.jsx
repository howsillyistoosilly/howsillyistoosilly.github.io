/* eslint-disable react/no-unknown-property */
import { useEffect, useMemo, useRef, useState, memo } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { useViewport } from '../context/ViewportContext'
import { WebGLPerfCollector } from './PerfMonitor'
import './PixelTrail.css'

const TRAIL_POINTS = 16

// --- 100% GPU Line-Segment Distance Pixel Trail Shader -------------------

const VERTEX_SHADER = `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const FRAGMENT_SHADER = `
  uniform vec2 uResolution;
  uniform float uGridSize;
  uniform vec3 uPixelColor;
  uniform vec3 uTrail[${TRAIL_POINTS}]; // x: uv.x, y: uv.y, z: age/alpha (1.0 to 0.0)
  uniform float uTrailRadius;

  // Calculates exact distance from point p to line segment a-b in aspect-corrected space
  float distanceToSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.00001), 0.0, 1.0);
    return length(pa - ba * h);
  }

  void main() {
    // 1:1 Direct viewport screen UV (0.0 to 1.0)
    vec2 screenUv = gl_FragCoord.xy / uResolution;

    // Aspect-ratio correction factor for distance math
    vec2 aspect = vec2(1.0, uResolution.y / uResolution.x);

    // Discrete aspect-correct pixel grid cell center
    vec2 aspectGrid = vec2(uGridSize, uGridSize * (uResolution.y / uResolution.x));
    vec2 cellCenter = (floor(screenUv * aspectGrid) + 0.5) / aspectGrid;
    vec2 cellAspect = cellCenter * aspect;

    float maxStrength = 0.0;

    // Evaluate line segments between consecutive trail points on GPU in parallel
    for (int i = 0; i < ${TRAIL_POINTS} - 1; i++) {
      vec3 pA = uTrail[i];
      vec3 pB = uTrail[i + 1];

      if (pA.z <= 0.001 && pB.z <= 0.001) continue;

      vec2 aAspect = pA.xy * aspect;
      vec2 bAspect = pB.xy * aspect;

      float segDist = distanceToSegment(cellAspect, aAspect, bAspect);
      float avgAge = max(pA.z, pB.z);

      // Sharp discrete step matching original retro pixel block look
      float radius = uTrailRadius * (0.3 + 0.7 * avgAge);
      float floatFactor = step(segDist, radius);

      float strokeStrength = floatFactor * avgAge;
      maxStrength = max(maxStrength, strokeStrength);
    }

    gl_FragColor = vec4(uPixelColor, maxStrength);
  }
`

const GpuSegmentTrailMaterial = shaderMaterial(
  {
    uResolution: new THREE.Vector2(),
    uGridSize: 150,
    uPixelColor: new THREE.Color('#ffffff'),
    uTrailRadius: 0.035,
    uTrail: Array.from({ length: TRAIL_POINTS }, () => new THREE.Vector3(-10, -10, 0)),
  },
  VERTEX_SHADER,
  FRAGMENT_SHADER
)

function GpuSegmentTrailPlane({ gridSize, trailSize, maxAge = 400, pixelColor, onWebGLStats }) {
  const { width, height } = useThree(s => s.size)
  const viewport = useThree(s => s.viewport)
  const { mouseRef } = useViewport()

  const material = useMemo(() => new GpuSegmentTrailMaterial(), [])
  const colorObj = useMemo(() => new THREE.Color(pixelColor), [pixelColor])
  
  const resolutionVec = useMemo(() => {
    return new THREE.Vector2(width * viewport.dpr, height * viewport.dpr)
  }, [width, height, viewport.dpr])

  // Static pre-allocated ring buffer array (0 JS garbage collection memory allocations!)
  const trailArray = useMemo(() => {
    return Array.from({ length: TRAIL_POINTS }, () => new THREE.Vector3(-10, -10, 0))
  }, [])

  const writeHeadRef = useRef(0)
  const lastMouseRef = useRef({ x: -1, y: -1 })

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)

    // Fade trail points on GPU ring buffer
    const decayRate = Math.pow(0.01, dt / (maxAge / 1000))
    for (let i = 0; i < TRAIL_POINTS; i++) {
      if (trailArray[i].z > 0.001) {
        trailArray[i].z *= decayRate
        if (trailArray[i].z < 0.001) trailArray[i].z = 0
      }
    }

    // Push new mouse position into ring buffer ONLY when cursor moves > 0.5px
    if (mouseRef.current) {
      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      const dx = mx - lastMouseRef.current.x
      const dy = my - lastMouseRef.current.y
      const distSq = dx * dx + dy * dy

      if (distSq > 0.25) {
        lastMouseRef.current.x = mx
        lastMouseRef.current.y = my

        const head = writeHeadRef.current
        trailArray[head].set(
          mx / window.innerWidth,
          1 - (my / window.innerHeight),
          1.0
        )
        writeHeadRef.current = (head + 1) % TRAIL_POINTS
      }
    }

    material.uniforms.uTrail.value = trailArray
  })

  const scale = Math.max(viewport.width, viewport.height) / 2

  return (
    <>
      <WebGLPerfCollector onStats={onWebGLStats} />
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
    </>
  )
}

function PixelTrailComponent({
  gridSize = 150,
  trailSize = 0.035,
  maxAge = 400,
  color = '#f0f0f0',
  onWebGLStats = () => {},
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
        <GpuSegmentTrailPlane
          gridSize={gridSize}
          trailSize={trailSize}
          maxAge={maxAge}
          pixelColor={color}
          onWebGLStats={onWebGLStats}
        />
      </Canvas>
    </div>
  )
}

export default memo(PixelTrailComponent)
