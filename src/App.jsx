import { lazy, Suspense } from 'react'
import './App.css'
import { ViewportProvider } from './context/ViewportContext'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import ProjectCard from './components/ProjectCard'
import VideoParallax from './components/VideoParallax'
import AboutSection from './components/AboutSection'
import ContactSection from './components/ContactSection'

import retroSnake from './assets/retro-snake.png'
import monotone from './assets/monotone.png'
import proceduralTerrain from './assets/procedural_terrain_generation.jpg'
import mousiee from './assets/mousie.png'
import cubed from './assets/cubed.png'
import controllerGlb from './assets/controller.glb'

import finalCompWebm from './assets/FinalComp.webm'
import finalCompMp4 from './assets/FinalComp.mp4'

import ntlTrailerWebm from './assets/ntlTrailer.webm'
import ntlTrailerMp4 from './assets/ntlTrailer.mp4'

import backroomsWebm from './assets/backrooms.webm'
import backroomsMp4 from './assets/backrooms.mp4'

import poster1Image from './assets/poster1.jpeg'

// Lazy load heavy Three.js / R3F Canvas components with Suspense
const PixelTrail = lazy(() => import('./components/PixelTrail'))
const ControllerModel = lazy(() => import('./components/ControllerModel'))

const PROJECTS = Object.freeze([
  { num:'01', type:'Gameplay Systems', title:'Kinematic Player Movement', desc:'A movement system using kinematic physics with variable gravity zones and jump height that changes based on button hold time. Added coyote time and input buffering for smoother, more responsive controls.', tags:['unity','c#','physics'], link:'#', linkLabel:'gameplay video', proj_screen:'https://media1.tenor.com/m/LyiynwDA18oAAAAd/hai.gif' },
  { num:'02', type:'Shader Art', title:'Retro Snake', desc:'Classic snake with a full CRT visual treatment — scanlines, screen curvature, and chromatic aberration via custom shaders and post-processing to nail the old arcade monitor look.', tags:['unity','c#','hlsl','post-fx'], link:'#', linkLabel:'play on itch.io', proj_screen: retroSnake },
  { num:'03', type:'2D Platformer', title:'Monotone', desc:'A 2D platformer where you switch between dark and light modes — each reveals different platforms so you need to plan your route. Smooth transitions via shaders and particle effects. The mode swap is the mechanic.', tags:['unity','c#','shaders','particles'], link:'#', linkLabel:'play on itch.io', proj_screen: monotone },
  { num:'04', type:'Procedural Generation', title:'Procedural Terrain Generator', desc:"A voxel terrain system inspired by Minecraft and Terraria. Perlin noise for varied terrain shapes with chunk-based loading for performance. Built to go deep into Unity's mesh API.", tags:['unity','c#','mesh api','perlin noise'], link:'#', linkLabel:'check it out', proj_screen: proceduralTerrain },
  { num:'05', type:'Physics / Mobile', title:'Mousiee', desc:'Drag to set trajectory and velocity for a space mouse hunting cheese around the moon, then physics takes over. Real orbital mechanics for careful path planning.', tags:['unity','c#','orbital mechanics'], link:'#', linkLabel:'check it out', proj_screen: mousiee },
  { num:'06', type:'Game Jam · Puzzle', title:'Cubed', desc:'GMTK Game Jam 2025. You play as a cube solving puzzles with a time loop mechanic. Handled all level design and main menu UI. Ranked top 3,000 out of 9,500+ entries.', tags:['unity','level design','ui','game jam'], link:'#', linkLabel:'play on itch.io', proj_screen: cubed },
])

const REEL = Object.freeze([
  { title: 'Arythmatic', tag: 'motion graphics', webm: finalCompWebm, mp4: finalCompMp4, poster: poster1Image },
  { title: 'Next Tech Lab', tag: 'after effects', webm: ntlTrailerWebm, mp4: ntlTrailerMp4, poster: '' },
  { title: '3D Renders', tag: 'Backrooms', webm: backroomsWebm, mp4: backroomsMp4, poster: '' },
])

export default function App() {
  return (
    <ViewportProvider>
      <Suspense fallback={null}>
        <PixelTrail
          gridSize={150}
          trailSize={0.035}
          maxAge={400}
          interpolate={8}
          color="#f0f0f0"
        />
      </Suspense>

      <Navbar />

      <HeroSection
        ControllerModel={ControllerModel}
        controllerGlb={controllerGlb}
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

      <AboutSection />

      <ContactSection />
    </ViewportProvider>
  )
}
