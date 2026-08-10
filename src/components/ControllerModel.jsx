import { useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, OrbitControls, Stage } from '@react-three/drei'
import * as THREE from 'three'

function Model({ path }) {
  const { scene } = useGLTF(path)
  const ref = useRef()

  const mat = useMemo(() => {
    const grad = document.createElement('canvas')
    grad.width = 256; grad.height = 1
    const gctx = grad.getContext('2d')
    gctx.fillStyle = '#222222'; gctx.fillRect(0,   0, 128, 1)
    gctx.fillStyle = '#ffffff'; gctx.fillRect(128, 0, 128, 1)
    const gradTex = new THREE.CanvasTexture(grad)
    gradTex.minFilter = gradTex.magFilter = THREE.NearestFilter

    return new THREE.MeshToonMaterial({
      gradientMap: gradTex,
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
    return () => {
      mat.gradientMap?.dispose()
      mat.dispose()
    }
  }, [scene, mat])

  useFrame((_, delta) => {
    ref.current.rotation.y += delta * 0.4
  })

  return <primitive ref={ref} object={scene} />
}

useGLTF.preload('/controller.glb')

export default function ControllerModel({ path }) {
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
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
        gl.domElement.style.background = 'transparent'
      }}
      dpr={Math.min(window.devicePixelRatio, 2)}
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