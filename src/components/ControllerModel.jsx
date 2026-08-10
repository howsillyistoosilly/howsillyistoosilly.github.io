import { useRef, useEffect, useMemo, memo } from 'react'
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
    if (!ref.current || !mouseRef.current) return
    const targetX = mouseRef.current.normalizedX * 0.6
    const targetY = mouseRef.current.normalizedY * 0.4

    // Delta-independent smooth 120fps lerp inertia
    const factor = Math.min(delta * 4, 0.1)
    ref.current.rotation.y += delta * 0.4 + (targetX - ref.current.rotation.y * 0.1) * factor
    ref.current.rotation.x += (targetY - ref.current.rotation.x) * factor
  })

  return <primitive ref={ref} object={scene} />
}

function ControllerModel({ path }) {
  const handleCreated = useMemo(() => ({ gl }) => {
    gl.setClearColor(0x000000, 0)
    gl.domElement.style.background = 'transparent'
  }, [])

  return (
    <Canvas
      id="controller-canvas"
      style={{ width: '100%', height: '100%', background: 'transparent' }}
      camera={{ position: [0, 0, 3], fov: 45 }}
      gl={{
        antialias: true,
        alpha: true,
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
  )
}

export default memo(ControllerModel)
