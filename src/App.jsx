import { lazy, Suspense, useEffect, useMemo, useState, useCallback } from 'react'
import './App.css'
import './components/portfolio.css'
import { ViewportProvider } from './context/ViewportContext'
import BlogPage from './components/BlogPage'
import MotionGallery from './components/MotionGallery'
import AnimatedGridBackground from './components/AnimatedGridBackground'
import Header from './components/Header'
import HeroSection from './components/HeroSection'
import ProjectsSection from './components/ProjectsSection'
import MotionSection from './components/MotionSection'
import VisualsSection from './components/VisualsSection'
import AboutSection from './components/AboutSection'
import ContactSection from './components/ContactSection'
import Footer from './components/Footer'
import AccentManager from './components/AccentManager'
import SmoothScroll from './components/SmoothScroll'
import DesignRuler from './components/DesignRuler'
import LoadingScreen from './components/LoadingScreen'
import adarsh from './assets/adarsh.jpeg'
import adarsh1 from './assets/adarsh1.jpeg'

import retroSnake from './assets/retro-snake.png'
import monotone from './assets/monotone.png'
import proceduralTerrain from './assets/procedural_terrain_generation.jpg'
import mousiee from './assets/mousie.png'
import cubed from './assets/cubed.png'
import kinematicMovement from './assets/kinematic-movement.jpg'

import nextTechLabWebm from './assets/next-tech-lab.webm'
import arythmaticWebm from './assets/arythmatic.webm'
import ntlTrailerWebm from './assets/ntl-trailer.webm'
import backroomsWebm from './assets/backrooms.webm'
import arythmaticPoster from './assets/arythmatic-poster.jpeg'

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

const REEL = Object.freeze([
  {
    id: 'next-tech-lab-branding',
    num: '01',
    title: 'Next Tech Lab',
    tag: 'motion graphics',
    webm: nextTechLabWebm,
    poster: '',
    desc: 'Kinetic typography, brand identity, and stylized 3D motion design created for Next Tech Lab. Dynamic camera tracking, rhythmic pacing, and high-energy motion aesthetics.',
    software: ['After Effects', 'Cinema 4D', 'Illustrator', 'Sound Design'],
  },
  {
    id: 'arythmatic',
    num: '02',
    title: 'Arythmatic',
    tag: 'motion graphics',
    webm: arythmaticWebm,
    poster: arythmaticPoster,
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

  const [activeAccentLabel, setActiveAccentLabel] = useState('core')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const handleAccentChange = (e) => {
      if (e.detail && e.detail.label) {
        setActiveAccentLabel(e.detail.label)
      }
    }
    window.addEventListener('accentchange', handleAccentChange)
    return () => window.removeEventListener('accentchange', handleAccentChange)
  }, [])

  return (
    <ViewportProvider>
      {isLoading && (
        <LoadingScreen
          criticalAssets={[adarsh, adarsh1]}
          onComplete={() => setIsLoading(false)}
        />
      )}
      <SmoothScroll />
      <AnimatedGridBackground />
      <DesignRuler activeSection={activeAccentLabel} />
      <AccentManager />

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
        <div className="dvb-root">
          <div className="dvb-page-grid">
            {/* 4 Structural vertical guide lines */}
            <div className="dvb-vertical-guides" aria-hidden="true">
              <i className="dvb-v-line dvb-v-line--outer-l" />
              <i className="dvb-v-line dvb-v-line--inner-l" />
              <i className="dvb-v-line dvb-v-line--inner-r" />
              <i className="dvb-v-line dvb-v-line--outer-r" />
            </div>

            {/* minimalist header */}
            <Header
              onNavigateToBlog={navigateToBlog}
              onNavigateToMotion={() => handleOpenGalleryModal(0)}
            />

            <main>
              {/* hero section */}
              <HeroSection
                primaryPhoto={adarsh}
                onNavigateToBlog={navigateToBlog}
              />

              {/* 3-column project rows */}
              <ProjectsSection projects={PROJECTS} />

              {/* motion reel cards with instant cinema playback */}
              <MotionSection
                items={REEL}
                onOpenGallery={handleOpenGalleryModal}
              />

              {/* visuals & photography masonry */}
              <VisualsSection
                photos={orderedPhotos}
                draggedPhotoId={draggedPhotoId}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                onDragEnd={() => setDraggedPhotoId(null)}
              />

              {/* about specs & story */}
              <AboutSection />

              {/* "let's talk." contact */}
              <ContactSection />
            </main>

            {/* footer */}
            <Footer
              onNavigateToBlog={navigateToBlog}
              onNavigateToMotion={() => handleOpenGalleryModal(0)}
            />
          </div>

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
        </div>
      )}
    </ViewportProvider>
  )
}

