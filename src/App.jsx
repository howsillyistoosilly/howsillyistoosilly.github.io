import { useEffect } from 'react'
import './App.css'
import PixelTrail from './components/PixelTrail'
import VideoParallax from './components/VideoParallax'
import retroSnake from './assets/retro-snake.png'
import monotone from './assets/monotone.png'
import proceduralTerrain from './assets/procedural_terrain_generation.jpg'
import mousiee from './assets/mousie.png'
import cubed from './assets/cubed.png'
import ControllerModel from './components/ControllerModel'
import controllerGlb from './assets/controller.glb'

const PROJECTS = [
  { num:'01', type:'Gameplay Systems', title:'Kinematic Player Movement', desc:'A movement system using kinematic physics with variable gravity zones and jump height that changes based on button hold time. Added coyote time and input buffering for smoother, more responsive controls.', tags:['unity','c#','physics'], link:'#', linkLabel:'gameplay video', proj_screen:'https://media1.tenor.com/m/LyiynwDA18oAAAAd/hai.gif' },
  { num:'02', type:'Shader Art', title:'Retro Snake', desc:'Classic snake with a full CRT visual treatment — scanlines, screen curvature, and chromatic aberration via custom shaders and post-processing to nail the old arcade monitor look.', tags:['unity','c#','hlsl','post-fx'], link:'#', linkLabel:'play on itch.io', proj_screen: retroSnake },
  { num:'03', type:'2D Platformer', title:'Monotone', desc:'A 2D platformer where you switch between dark and light modes — each reveals different platforms so you need to plan your route. Smooth transitions via shaders and particle effects. The mode swap is the mechanic.', tags:['unity','c#','shaders','particles'], link:'#', linkLabel:'play on itch.io', proj_screen: monotone },
  { num:'04', type:'Procedural Generation', title:'Procedural Terrain Generator', desc:"A voxel terrain system inspired by Minecraft and Terraria. Perlin noise for varied terrain shapes with chunk-based loading for performance. Built to go deep into Unity's mesh API.", tags:['unity','c#','mesh api','perlin noise'], link:'#', linkLabel:'check it out', proj_screen: proceduralTerrain },
  { num:'05', type:'Physics / Mobile', title:'Mousiee', desc:'Drag to set trajectory and velocity for a space mouse hunting cheese around the moon, then physics takes over. Real orbital mechanics for careful path planning.', tags:['unity','c#','orbital mechanics'], link:'#', linkLabel:'check it out', proj_screen: mousiee },
  { num:'06', type:'Game Jam · Puzzle', title:'Cubed', desc:'GMTK Game Jam 2025. You play as a cube solving puzzles with a time loop mechanic. Handled all level design and main menu UI. Ranked top 3,000 out of 9,500+ entries.', tags:['unity','level design','ui','game jam'], link:'#', linkLabel:'play on itch.io', proj_screen: cubed },
]

// Fill these in with your own motion graphics / video edit clips.
// Import each video the same way the project images are imported above, e.g.:
//   import cosmicGirlReel from './assets/Jamiroquai - Cosmic Girl (Video).mp4'
// then reference it as `src: cosmicGirlReel` below. Cards alternate
// left/right drift automatically based on their position in this array.
const REEL = [
  { title: 'Arythmatic', tag: 'motion graphics', src: 'src/assets/FinalComp.mp4', poster: 'src/assets/poster1.jpeg' },
  { title: 'Next Tech Lab', tag: 'after effects', src: 'src/assets/ntlTrailer.mp4', poster: '' },
  { title: '3D Renders', tag: 'Backrooms', src: 'src/assets/backrooms.mkv', poster: '' },
]

function Chip({ label }) {
  return <span className="chip"><span>{label}</span></span>
}

function Project({ num, type, title, desc, tags, link, linkLabel, proj_screen }) {
  return (
    <div className="proj">
      <div className="proj-num">{num}</div>
      <div className="proj-info">
        <div className="proj-type">{type}</div>
        <div className="proj-title">{title}</div>
        <div className="proj-desc">{desc}</div>
        <div className="proj-tags">{tags.map(t => <Chip key={t} label={t} />)}</div>
        <a className="proj-link" href={link}>{linkLabel}</a>
      </div>
      <div className="proj-screen">
        {proj_screen ? (
          <img
            src={proj_screen}
            alt={`${title} screenshot`}
            className="proj-screen-img"
          />
        ) : (
          <div className="proj-screen-placeholder">
            <div className="proj-screen-label">screenshot / gif</div>
            <div className="proj-screen-hint">replace with image</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <>
      <PixelTrail
        gridSize={150}
        trailSize={0.035}
        maxAge={400}
        interpolate={8}
        color="#f0f0f0"
      />

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
              {['unity','Motion Graphics','Video Editing','c#','c++','blender','aseprite','level design','game jams','physics'].map(t => <Chip key={t} label={t} />)}
            </div>
          </div>
        </div>
        <div className="hero-right">
          <div className="hero-model">
            <ControllerModel path={controllerGlb} />
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
          {PROJECTS.map(p => <Project key={p.num} {...p} />)}
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
    </>
  )
}