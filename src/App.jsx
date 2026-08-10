import { lazy, Suspense } from 'react'
import './App.css'
import { ViewportProvider } from './context/ViewportContext'
import ProjectCard, { Chip } from './components/ProjectCard'
import VideoParallax from './components/VideoParallax'

import retroSnake from './assets/retro-snake.png'
import monotone from './assets/monotone.png'
import proceduralTerrain from './assets/procedural_terrain_generation.jpg'
import mousiee from './assets/mousie.png'
import cubed from './assets/cubed.png'
import controllerGlb from './assets/controller.glb'

import finalCompVideo from './assets/FinalComp.mp4'
import ntlTrailerVideo from './assets/ntlTrailer.mp4'
import backroomsVideo from './assets/backrooms.mkv'
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
  { title: 'Arythmatic', tag: 'motion graphics', src: finalCompVideo, poster: poster1Image },
  { title: 'Next Tech Lab', tag: 'after effects', src: ntlTrailerVideo, poster: '' },
  { title: '3D Renders', tag: 'Backrooms', src: backroomsVideo, poster: '' },
])

const HERO_SKILLS = Object.freeze([
  'unity', 'Motion Graphics', 'Video Editing', 'c#', 'c++', 'blender', 'aseprite', 'level design', 'game jams', 'physics'
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

      <nav>
        <div className="logo">howsillyistoosilly</div>
        <ul>
          <li><a href="#projects">projects</a></li>
          <li><a href="#motion">motion</a></li>
          <li><a href="#about">about</a></li>
          <li><a href="#contact">contact</a></li>
        </ul>
      </nav>

      <div className="hero">
        <div className="hero-left">
          <div>
            <div className="hero-tag">Game Developer · 3D/2D Artist · Unity · C#</div>
            <h1 className="hero-name">Adarsh<br /><em>Satish</em></h1>
            <div className="hero-role">Gameplay Programmer · Level Designer</div>
            <p className="hero-desc">Just being a silly dev making stuff he finds cool and things he finds pretty.</p>
            <div className="chips">
              {HERO_SKILLS.map(t => <Chip key={t} label={t} />)}
            </div>
          </div>
        </div>
        <div className="hero-right">
          <div className="hero-model">
            <Suspense fallback={<div className="model-placeholder" />}>
              <ControllerModel path={controllerGlb} />
            </Suspense>
          </div>
          <div className="hero-corner">
            <span>open to work · collabs · game jams</span>
            <span>Next Tech Lab · Oct 2024 — Present</span>
          </div>
        </div>
      </div>

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

      <div className="section" id="about">
        <div className="sec-head">
          <span className="sec-num">03 — about</span>
          <h2 className="sec-title">About <em>Me</em></h2>
        </div>
        <div className="about-wrap">
          <div className="about-left">
            <div className="about-id">howsillyistoosilly</div>
            <div className="about-sub">Game Developer</div>
            <div className="about-meta">
              <div className="meta-row"><span className="meta-key">role</span><span>game dev</span></div>
              <div className="meta-row"><span className="meta-key">status</span><span>open to work</span></div>
              <div className="meta-row"><span className="meta-key">cert</span><span>Unity Jr. Programmer</span></div>
              <div className="meta-row"><span className="meta-key">lab</span><span>Next Tech Lab</span></div>
            </div>
          </div>
          <div className="about-right">
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.<br /><br />Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
          </div>
        </div>
      </div>

      <div className="section" id="contact">
        <div className="sec-head">
          <span className="sec-num">04 — contact</span>
          <h2 className="sec-title">Say <em>Hello</em></h2>
        </div>
        <div className="contact-wrap">
          <div className="contact-left">
            <p>want to collab on a jam, talk about games, or just say hi? always down.</p>
            <div className="clinks">
              <a className="clink" href="mailto:adarshsatish06@example.com">email</a>
              <a className="clink" href="https://howsillyistoosilly.itch.io">itch.io</a>
              <a className="clink" href="https://github.com/howsillyistoosilly">github</a>
              <a className="clink" href="https://linkedin.com/in/AdarshSatish06">linkedin</a>
            </div>
          </div>
          <div className="contact-right">
            <div className="contact-big">open to<br /><em>collabs &</em><br />game jams</div>
          </div>
        </div>
      </div>

      <footer>
        <span>howsillyistoosilly</span>
        <span>© 2026</span>
        <span>Adarsh Satish</span>
      </footer>
    </ViewportProvider>
  )
}
