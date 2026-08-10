import { useRef, useEffect, useState, useMemo, memo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, OrbitControls, Stage } from '@react-three/drei'
import * as THREE from 'three'
import { useViewport } from '../context/ViewportContext'

let cachedGradTex = null
function getGradientTexture() {
  if (cachedGradTex) return cachedGradTex
  if (typeof document === 'undefined') return null

  const grad = document.createElement('canvas')
  grad.width = 256
  grad.height = 1
  const gctx = grad.getContext('2d')
  gctx.fillStyle = '#222222'
  gctx.fillRect(0, 0, 128, 1)
  gctx.fillStyle = '#ffffff'
  gctx.fillRect(128, 0, 128, 1)

  cachedGradTex = new THREE.CanvasTexture(grad)
  cachedGradTex.minFilter = THREE.NearestFilter
  cachedGradTex.magFilter = THREE.NearestFilter
  return cachedGradTex
}

function Model({ path }) {
  const { scene } = useGLTF(path)
  const ref = useRef()
  const spinY = useRef(0)
  const tiltRef = useRef({ x: 0, y: 0 })
  const { mouseRef } = useViewport()

  const mat = useMemo(() => {
    return new THREE.MeshToonMaterial({
      gradientMap: getGradientTexture(),
      color: 0xffffff,
    })
  }, [])

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = mat
        child.frustumCulled = true
      }
    })
  }, [scene, mat])

  useFrame((_, delta) => {
    if (!ref.current) return

    spinY.current += delta * 0.4
    const targetTiltX = mouseRef.current ? mouseRef.current.normalizedX * 0.5 : 0
    const targetTiltY = mouseRef.current ? mouseRef.current.normalizedY * 0.3 : 0

    const factor = Math.min(delta * 6, 0.15)
    tiltRef.current.x += (targetTiltX - tiltRef.current.x) * factor
    tiltRef.current.y += (targetTiltY - tiltRef.current.y) * factor

    ref.current.rotation.y = spinY.current + tiltRef.current.x
    ref.current.rotation.x = tiltRef.current.y
  })

  return <primitive ref={ref} object={scene} />
}

function ControllerModel({ path }) {
  const containerRef = useRef(null)
  const [isVisible, setIsVisible] = useState(true)

  // IntersectionObserver + Document Visibility: Freeze canvas rendering completely when offscreen or tab inactive
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let isIntersecting = true
    let isTabVisible = !document.hidden

    const updateVisibility = () => {
      setIsVisible(isIntersecting && isTabVisible)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isIntersecting = entry.isIntersecting
          updateVisibility()
        })
      },
      { threshold: 0.05 }
    )

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden
      updateVisibility()
    }

    observer.observe(el)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const handleCreated = useMemo(() => ({ gl }) => {
    gl.setClearColor(0x000000, 0)
    gl.domElement.style.background = 'transparent'
  }, [])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <Canvas
        id="controller-canvas"
        style={{ width: '100%', height: '100%', background: 'transparent' }}
        camera={{ position: [0, 0, 3], fov: 45 }}
        frameloop={isVisible ? 'always' : 'never'}
        gl={{
          antialias: true,
          alpha: true,
          premultipliedAlpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        onCreated={handleCreated}
        dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1}
      >
        <ambientLight intensity={0.15} />
        <directionalLight position={[2, 4, 2]} intensity={1.4} />
        <directionalLight position={[-2, -1, -2]} intensity={0.2} />
        <Stage adjustCamera environment={null}>
          <Model path={path} />
        </Stage>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.6}
          makeDefault
        />
      </Canvas>
    </div>
  )
}

export default memo(ControllerModel)
