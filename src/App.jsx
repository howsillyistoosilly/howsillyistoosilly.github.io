import { lazy, Suspense, useEffect, useMemo, useState, useCallback } from 'react'
import './App.css'
import { ViewportProvider } from './context/ViewportContext'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import ProjectCard from './components/ProjectCard'
import VideoParallax from './components/VideoParallax'
import MotionGallery from './components/MotionGallery'
import AboutSection from './components/AboutSection'
import ContactSection from './components/ContactSection'
import BlogPage from './components/BlogPage'
import adarsh from './assets/adarsh.jpeg'
import adarsh1 from './assets/adarsh1.jpeg'

import retroSnake from './assets/retro-snake.png'
import monotone from './assets/monotone.png'
import proceduralTerrain from './assets/procedural_terrain_generation.jpg'
import mousiee from './assets/mousie.png'
import cubed from './assets/cubed.png'
import kinematicMovement from './assets/kinematic-movement.jpg'

import finalFinalFinalWebm from './assets/FINALFINALFINAL.webm'
import finalCompWebm from './assets/FinalComp.webm'
import ntlTrailerWebm from './assets/ntlTrailer.webm'
import backroomsWebm from './assets/backrooms.webm'
import poster1Image from './assets/poster1.jpeg'

// Lazy load heavy Three.js / R3F Canvas components with Suspense
const PixelTrail = lazy(() => import('./components/PixelTrail'))

const PHOTOS = Object.entries(
  import.meta.glob('./assets/photography/*.{jpg,jpeg,png,webp,avif,gif}', {
    eager: true,
    import: 'default',
  })
)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
  .map(([path, src]) => {
    const fileName = path.split('/').pop() || 'photo'
    const label = fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
    return { id: path, src, alt: label }
  })

const PHOTO_ORDER_KEY = 'photography-sequence'

function getInitialPhotoOrder(photos) {
  if (typeof window === 'undefined') return photos.map(photo => photo.id)

  try {
    const saved = JSON.parse(window.localStorage.getItem(PHOTO_ORDER_KEY) ?? 'null')
    const savedIds = Array.isArray(saved) ? saved.filter(id => photos.some(photo => photo.id === id)) : []
    const missingIds = photos.map(photo => photo.id).filter(id => !savedIds.includes(id))
    return [...savedIds, ...missingIds]
  } catch {
    return photos.map(photo => photo.id)
  }
}

function moveItem(items, fromId, toId) {
  const fromIndex = items.indexOf(fromId)
  const toIndex = items.indexOf(toId)
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return items

  const next = [...items]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  return next
}

const PROJECTS = Object.freeze([
  { num:'01', type:'2D Platformer', title:'Monotone', desc:'A 2D platformer where you switch between dark and light modes — each reveals different platforms so you need to plan your route. Smooth transitions via shaders and particle effects. The mode swap is the mechanic.', tags:['unity','c#','shaders','particles'], link:'https://howsillyistoosilly.itch.io/monotone', linkLabel:'play on itch.io', proj_screen: monotone },
  { num:'02', type:'Shader Art', title:'Retro Snake', desc:'Classic snake with a full CRT visual treatment — scanlines, screen curvature, and chromatic aberration via custom shaders and post-processing to nail the old arcade monitor look.', tags:['unity','c#','hlsl','post-fx'], link:'https://howsillyistoosilly.itch.io/desnake', linkLabel:'play on itch.io', proj_screen: retroSnake },
  { num:'03', type:'Procedural Generation', title:'Procedural Terrain Generator', desc:"A voxel terrain system inspired by Minecraft and Terraria. Perlin noise for varied terrain shapes with chunk-based loading for performance. Built to go deep into Unity's mesh API.", tags:['unity','c#','mesh api','perlin noise'], link:'https://github.com/howsillyistoosilly/procedural-terrain-generator', linkLabel:'check it out', proj_screen: proceduralTerrain },
  { num:'04', type:'Physics / Mobile', title:'Mousiee', desc:'Drag to set trajectory and velocity for a space mouse hunting cheese around the moon, then physics takes over. Real orbital mechanics for careful path planning.', tags:['unity','c#','orbital mechanics'], link:'https://github.com/howsillyistoosilly/Mousieeee', linkLabel:'check it out', proj_screen: mousiee },
  { num:'05', type:'Game Jam · Puzzle', title:'Cubed', desc:'GMTK Game Jam 2025. You play as a cube solving puzzles with a time loop mechanic. Handled all level design and main menu UI. Ranked top 3,000 out of 9,500+ entries.', tags:['unity','level design','ui','game jam'], link:'https://macientosh.itch.io/cubed', linkLabel:'play on itch.io', proj_screen: cubed },
  { num:'06', type:'Gameplay Systems', title:'Kinematic Player Movement', desc:'A movement system using kinematic physics with variable gravity zones and jump height that changes based on button hold time. Added coyote time and input buffering for smoother, more responsive controls.', tags:['unity','c#','physics'], link:'#', linkLabel:'gameplay video', proj_screen: kinematicMovement },
])

export const REEL = Object.freeze([
  {
    id: 'next-tech-lab-branding',
    num: '01',
    title: 'Next Tech Lab',
    tag: 'motion graphics',
    webm: finalFinalFinalWebm,
    poster: '',
    desc: 'Kinetic typography, brand identity, and stylized 3D motion design created for Next Tech Lab. Dynamic camera tracking, rhythmic pacing, and high-energy motion aesthetics.',
    software: ['After Effects', 'Cinema 4D', 'Illustrator', 'Sound Design'],
  },
  {
    id: 'arythmatic',
    num: '02',
    title: 'Arythmatic',
    tag: 'motion graphics',
    webm: finalCompWebm,
    poster: poster1Image,
    desc: 'High-contrast abstract motion study exploring algorithmic typography, distortion displacement, chromatic aberration, and synchronized beat drops.',
    software: ['After Effects', 'Premiere Pro', 'Photoshop'],
  },
  {
    id: 'next-tech-lab-trailer',
    num: '03',
    title: 'Next Tech Lab Trailer',
    tag: 'after effects',
    webm: ntlTrailerWebm,
    poster: '',
    desc: 'Cinematic recruitment and showcase trailer featuring sound-reactive glitch transitions, fast-paced compositing, and dynamic graphic overlays.',
    software: ['After Effects', 'Sound Design', 'Color Grading'],
  },
  {
    id: 'backrooms-3d',
    num: '04',
    title: '3D Renders — Backrooms',
    tag: 'Backrooms / 3D',
    webm: backroomsWebm,
    poster: '',
    desc: 'Liminal space atmospheric environment rendering and horror animation. Procedural fluorescent lighting flicker, VHS analog tracking noise, and spatial audio reverberation.',
    software: ['Blender', 'Cycles', 'After Effects', 'Audio Design'],
  },
])

function getRouteState() {
  if (typeof window === 'undefined') return { page: 'home', param: null }
  const host = window.location.hostname.toLowerCase()
  const path = window.location.pathname.toLowerCase()
  const hash = window.location.hash.toLowerCase()
  const searchParams = new URLSearchParams(window.location.search)

  if (
    host.startsWith('blog.') ||
    path === '/blog' ||
    path.startsWith('/blog/') ||
    hash === '#blog' ||
    hash === '#/blog'
  ) {
    return { page: 'blog', param: null }
  }

  if (
    path === '/motion' ||
    path.startsWith('/motion/') ||
    path === '/videos' ||
    path.startsWith('/videos/') ||
    hash === '#motion-gallery' ||
    hash === '#gallery'
  ) {
    const videoParam = searchParams.get('video') || (path.startsWith('/motion/') ? path.replace('/motion/', '') : null)
    return { page: 'motion', param: videoParam }
  }

  return { page: 'home', param: null }
}

export default function App() {
  const [routeState, setRouteState] = useState(getRouteState)
  const [activeMotionModal, setActiveMotionModal] = useState({ isOpen: false, videoIndex: 0, videoId: null })
  const photosById = useMemo(() => new Map(PHOTOS.map(photo => [photo.id, photo])), [])
  const [photoOrder, setPhotoOrder] = useState(() => getInitialPhotoOrder(PHOTOS))
  const [draggedPhotoId, setDraggedPhotoId] = useState(null)

  useEffect(() => {
    const updateRoute = () => {
      setRouteState(getRouteState())
    }

    window.addEventListener('popstate', updateRoute)
    window.addEventListener('hashchange', updateRoute)
    return () => {
      window.removeEventListener('popstate', updateRoute)
      window.removeEventListener('hashchange', updateRoute)
    }
  }, [])

  const navigateToBlog = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/blog')
      setRouteState({ page: 'blog', param: null })
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [])

  const navigateToHome = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/')
      setRouteState({ page: 'home', param: null })
      setActiveMotionModal({ isOpen: false, videoIndex: 0, videoId: null })
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [])

  const navigateToMotion = useCallback((videoIdOrIndex = 0) => {
    if (typeof window !== 'undefined') {
      const videoParam = typeof videoIdOrIndex === 'string' ? videoIdOrIndex : (REEL[videoIdOrIndex]?.id || '0')
      window.history.pushState({}, '', `/motion?video=${encodeURIComponent(videoParam)}`)
      setRouteState({ page: 'motion', param: videoParam })
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [])

  const handleOpenGalleryModal = useCallback((indexOrId) => {
    const idx = typeof indexOrId === 'number' ? indexOrId : REEL.findIndex(v => v.id === indexOrId)
    const validIdx = idx !== -1 ? idx : 0
    const videoId = REEL[validIdx]?.id || String(validIdx)
    setActiveMotionModal({ isOpen: true, videoIndex: validIdx, videoId })
  }, [])

  const handleCloseGalleryModal = useCallback(() => {
    setActiveMotionModal({ isOpen: false, videoIndex: 0, videoId: null })
    if (typeof window !== 'undefined' && window.location.pathname === '/') {
      const cleanUrl = new URL(window.location.href)
      cleanUrl.searchParams.delete('video')
      window.history.replaceState({}, '', cleanUrl.pathname + cleanUrl.hash)
    }
  }, [])

  const handleOpenSeparateTab = useCallback((videoIdOrIndex) => {
    const videoParam = typeof videoIdOrIndex === 'string' ? videoIdOrIndex : (REEL[videoIdOrIndex]?.id || videoIdOrIndex)
    if (typeof window !== 'undefined') {
      window.open(`/motion?video=${encodeURIComponent(videoParam)}`, '_blank', 'noopener,noreferrer')
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(PHOTO_ORDER_KEY, JSON.stringify(photoOrder))
  }, [photoOrder])

  const orderedPhotos = photoOrder
    .map(id => photosById.get(id))
    .filter(Boolean)

  const handleDragStart = (photoId) => (event) => {
    setDraggedPhotoId(photoId)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', photoId)
  }

  const handleDrop = (targetId) => (event) => {
    event.preventDefault()
    const sourceId = draggedPhotoId || event.dataTransfer.getData('text/plain')
    if (!sourceId || sourceId === targetId) return

    setPhotoOrder(current => moveItem(current, sourceId, targetId))
    setDraggedPhotoId(null)
  }

  return (
    <ViewportProvider>
      <Suspense fallback={null}>
        <PixelTrail
          gridSize={120}
          trailSize={0.03}
          maxAge={300}
          interpolate={8}
          color="#f0f0f0"
        />
      </Suspense>

      {routeState.page === 'blog' ? (
        <BlogPage onNavigateHome={navigateToHome} />
      ) : routeState.page === 'motion' ? (
        <MotionGallery
          videos={REEL}
          initialVideoId={routeState.param}
          onNavigateHome={navigateToHome}
          onNavigateToBlog={navigateToBlog}
        />
      ) : (
        <>
          <Navbar
            onNavigateToBlog={navigateToBlog}
            onNavigateToMotion={() => handleOpenGalleryModal(0)}
            onNavigateHome={navigateToHome}
          />

          <HeroSection
            primaryPhoto={adarsh}
            secondaryPhoto={adarsh1}
            onNavigateToBlog={navigateToBlog}
          />

          <div className="section" id="projects">
            <div className="sec-head">
              <span className="sec-num">01 — work</span>
              <h2 className="sec-title">Things I've <em>Built</em></h2>
            </div>
            <div className="proj-list">
              {PROJECTS.map(p => <ProjectCard key={p.num} {...p} />)}
            </div>
          </div>

          <div className="section" id="motion">
            <div className="sec-head">
              <span className="sec-num">02 — motion</span>
              <div className="sec-head-right">
                <h2 className="sec-title">Motion & <em>Video</em></h2>
                <span className="photos-hint">click to play with audio · full gallery</span>
              </div>
            </div>
            <VideoParallax
              items={REEL}
              onOpenGallery={handleOpenGalleryModal}
              onOpenSeparateTab={handleOpenSeparateTab}
            />
          </div>

          <div className="section" id="photos">
            <div className="sec-head">
              <span className="sec-num">03 — photos</span>
              <div className="sec-head-right">
                <h2 className="sec-title">Photography</h2>
                <span className="photos-hint">drag tiles to reorder</span>
              </div>
            </div>
            <div className="photos-masonry">
              {orderedPhotos.map((photo) => (
                <figure
                  className={`photo-tile${draggedPhotoId === photo.id ? ' photo-tile--dragging' : ''}`}
                  key={photo.id}
                  draggable
                  onDragStart={handleDragStart(photo.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleDrop(photo.id)}
                  onDragEnd={() => setDraggedPhotoId(null)}
                >
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    loading="lazy"
                    decoding="async"
                  />
                </figure>
              ))}
            </div>
          </div>

          <div className="info-grid">
            <AboutSection />
            <ContactSection />
          </div>

          <footer>
            <span>howsillyistoosilly</span>
            <span>© 2026</span>
            <span>Adarsh Satish</span>
          </footer>

          {/* Modal Theater Mode when clicking video from home */}
          {activeMotionModal.isOpen && (
            <MotionGallery
              isModal
              videos={REEL}
              initialVideoIndex={activeMotionModal.videoIndex}
              initialVideoId={activeMotionModal.videoId}
              onClose={handleCloseGalleryModal}
              onNavigateHome={navigateToHome}
              onNavigateToBlog={navigateToBlog}
            />
          )}
        </>
      )}
    </ViewportProvider>
  )
}

