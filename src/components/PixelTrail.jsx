/* eslint-disable react/no-unknown-property */
import { useEffect, useMemo, useRef, useState, memo } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { useViewport } from '../context/ViewportContext'
import './PixelTrail.css'

const FBO_SIZE = 512

// --- FBO Update Shader (Computes continuous line stroke math on GPU VRAM) ---

const FBO_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const FBO_FRAGMENT_SHADER = `
  varying vec2 vUv;
  uniform sampler2D tPrevTrail;
  uniform vec2 uCurrMouse;
  uniform vec2 uPrevMouse;
  uniform float uRadius;
  uniform float uDecay;
  uniform vec2 uAspect;

  float distanceToSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.00001), 0.0, 1.0);
    return length(pa - ba * h);
  }

  void main() {
    float prevVal = texture2D(tPrevTrail, vUv).r * uDecay;
    
    vec2 p = vUv * uAspect;
    vec2 a = uPrevMouse * uAspect;
    vec2 b = uCurrMouse * uAspect;

    float dist = distanceToSegment(p, a, b);
    float stroke = smoothstep(uRadius, 0.0, dist);

    float val = max(prevVal, stroke);
    gl_FragColor = vec4(val, 0.0, 0.0, 1.0);
  }
`

const FboUpdateMaterial = shaderMaterial(
  {
    tPrevTrail: null,
    uCurrMouse: new THREE.Vector2(-10, -10),
    uPrevMouse: new THREE.Vector2(-10, -10),
    uRadius: 0.035,
    uDecay: 0.96,
    uAspect: new THREE.Vector2(1, 1),
  },
  FBO_VERTEX_SHADER,
  FBO_FRAGMENT_SHADER
)

// --- Main Display Shader (Exact original coverUv & pixel grid quantization) ---

const DISPLAY_VERTEX_SHADER = `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const DISPLAY_FRAGMENT_SHADER = `
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
  DISPLAY_VERTEX_SHADER,
  DISPLAY_FRAGMENT_SHADER
)

function GpuFboTrailPlane({ gridSize, trailSize, maxAge = 400, pixelColor }) {
  const { width, height, gl } = useThree(s => ({ width: s.size.width, height: s.size.height, gl: s.gl }))
  const viewport = useThree(s => s.viewport)
  const { mouseRef } = useViewport()

  // Pre-allocated GPU FBO Targets (Ping-Pong buffers inside GPU VRAM)
  const fboTargets = useMemo(() => {
    const options = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RedFormat,
      type: THREE.UnsignedByteType,
      depthBuffer: false,
      stencilBuffer: false,
    }
    return [
      new THREE.WebGLRenderTarget(FBO_SIZE, FBO_SIZE, options),
      new THREE.WebGLRenderTarget(FBO_SIZE, FBO_SIZE, options),
    ]
  }, [])

  const fboScene = useMemo(() => {
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const mat = new FboUpdateMaterial()
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat)
    scene.add(quad)
    return { scene, camera, mat }
  }, [])

  const displayMat = useMemo(() => new DotMaterial(), [])
  const colorObj = useMemo(() => new THREE.Color(pixelColor), [pixelColor])
  
  const resolutionVec = useMemo(() => {
    return new THREE.Vector2(width * viewport.dpr, height * viewport.dpr)
  }, [width, height, viewport.dpr])

  const aspectVec = useMemo(() => {
    const maxDim = Math.max(width, height) || 1
    return new THREE.Vector2(width / maxDim, height / maxDim)
  }, [width, height])

  // Compute exact frame decay factor from maxAge prop
  const decayFactor = useMemo(() => {
    // 60FPS reference: decay = (1 - (1000 / maxAge / 60))
    const framesToLive = (maxAge / 1000) * 60
    return Math.max(0.85, Math.min(0.99, 1.0 - (2.5 / Math.max(framesToLive, 1))))
  }, [maxAge])

  const readIndexRef = useRef(0)
  const currMouseVec = useRef(new THREE.Vector2(-10, -10))
  const prevMouseVec = useRef(new THREE.Vector2(-10, -10))

  useFrame(() => {
    if (mouseRef.current) {
      const mx = mouseRef.current.x / window.innerWidth
      const my = 1 - (mouseRef.current.y / window.innerHeight)
      
      prevMouseVec.current.copy(currMouseVec.current)
      currMouseVec.current.set(mx, my)
    }

    const readTarget = fboTargets[readIndexRef.current]
    const writeTarget = fboTargets[1 - readIndexRef.current]

    // Pass GPU FBO update uniforms
    fboScene.mat.uniforms.tPrevTrail.value = readTarget.texture
    fboScene.mat.uniforms.uCurrMouse.value.copy(currMouseVec.current)
    fboScene.mat.uniforms.uPrevMouse.value.copy(prevMouseVec.current)
    fboScene.mat.uniforms.uRadius.value = trailSize
    fboScene.mat.uniforms.uDecay.value = decayFactor
    fboScene.mat.uniforms.uAspect.value.copy(aspectVec)

    // Render 100% inside GPU VRAM without CPU canvas texture upload
    gl.setRenderTarget(writeTarget)
    gl.render(fboScene.scene, fboScene.camera)
    gl.setRenderTarget(null)

    // Swap Ping-Pong targets
    readIndexRef.current = 1 - readIndexRef.current

    // Bind current GPU FBO texture to display material
    displayMat.uniforms.mouseTrail.value = writeTarget.texture
  })

  useEffect(() => {
    return () => {
      fboTargets[0].dispose()
      fboTargets[1].dispose()
      fboScene.mat.dispose()
      displayMat.dispose()
    }
  }, [fboTargets, fboScene, displayMat])

  const scale = Math.max(viewport.width, viewport.height) / 2

  return (
    <mesh scale={[scale, scale, 1]}>
      <planeGeometry args={[2, 2]} />
      <primitive
        object={displayMat}
        gridSize={gridSize}
        pixelColor={colorObj}
        resolution={resolutionVec}
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
        <GpuFboTrailPlane
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
