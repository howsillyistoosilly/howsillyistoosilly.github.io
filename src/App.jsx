import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import './App.css'
import { ViewportProvider } from './context/ViewportContext'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import ProjectCard from './components/ProjectCard'
import VideoParallax from './components/VideoParallax'
import AboutSection from './components/AboutSection'
import ContactSection from './components/ContactSection'
import adarsh from './assets/adarsh.jpeg'
import adarsh1 from './assets/adarsh1.jpeg'

import retroSnake from './assets/retro-snake.png'
import monotone from './assets/monotone.png'
import proceduralTerrain from './assets/procedural_terrain_generation.jpg'
import mousiee from './assets/mousie.png'
import cubed from './assets/cubed.png'

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
  { num:'01', type:'Gameplay Systems', title:'Kinematic Player Movement', desc:'A movement system using kinematic physics with variable gravity zones and jump height that changes based on button hold time. Added coyote time and input buffering for smoother, more responsive controls.', tags:['unity','c#','physics'], link:'#', linkLabel:'gameplay video', proj_screen:'https://media1.tenor.com/m/LyiynwDA18oAAAAd/hai.gif' },
  { num:'02', type:'Shader Art', title:'Retro Snake', desc:'Classic snake with a full CRT visual treatment — scanlines, screen curvature, and chromatic aberration via custom shaders and post-processing to nail the old arcade monitor look.', tags:['unity','c#','hlsl','post-fx'], link:'#', linkLabel:'play on itch.io', proj_screen: retroSnake },
  { num:'03', type:'2D Platformer', title:'Monotone', desc:'A 2D platformer where you switch between dark and light modes — each reveals different platforms so you need to plan your route. Smooth transitions via shaders and particle effects. The mode swap is the mechanic.', tags:['unity','c#','shaders','particles'], link:'#', linkLabel:'play on itch.io', proj_screen: monotone },
  { num:'04', type:'Procedural Generation', title:'Procedural Terrain Generator', desc:"A voxel terrain system inspired by Minecraft and Terraria. Perlin noise for varied terrain shapes with chunk-based loading for performance. Built to go deep into Unity's mesh API.", tags:['unity','c#','mesh api','perlin noise'], link:'#', linkLabel:'check it out', proj_screen: proceduralTerrain },
  { num:'05', type:'Physics / Mobile', title:'Mousiee', desc:'Drag to set trajectory and velocity for a space mouse hunting cheese around the moon, then physics takes over. Real orbital mechanics for careful path planning.', tags:['unity','c#','orbital mechanics'], link:'#', linkLabel:'check it out', proj_screen: mousiee },
  { num:'06', type:'Game Jam · Puzzle', title:'Cubed', desc:'GMTK Game Jam 2025. You play as a cube solving puzzles with a time loop mechanic. Handled all level design and main menu UI. Ranked top 3,000 out of 9,500+ entries.', tags:['unity','level design','ui','game jam'], link:'#', linkLabel:'play on itch.io', proj_screen: cubed },
])

const REEL = Object.freeze([
  { title: 'Next Tech Lab', tag: 'motion graphics', webm: finalFinalFinalWebm, poster: '' },
  { title: 'Arythmatic', tag: 'motion graphics', webm: finalCompWebm, poster: poster1Image },
  { title: 'Next Tech Lab', tag: 'after effects', webm: ntlTrailerWebm, poster: '' },
  { title: '3D Renders', tag: 'Backrooms', webm: backroomsWebm, poster: '' },
])

export default function App() {
  const photosById = useMemo(() => new Map(PHOTOS.map(photo => [photo.id, photo])), [])
  const [photoOrder, setPhotoOrder] = useState(() => getInitialPhotoOrder(PHOTOS))
  const [draggedPhotoId, setDraggedPhotoId] = useState(null)

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

      <Navbar />

      <HeroSection
        primaryPhoto={adarsh}
        secondaryPhoto={adarsh1}
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
          <h2 className="sec-title">Motion & <em>Video</em></h2>
        </div>
        <VideoParallax items={REEL} />
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
    </ViewportProvider>
  )
}
