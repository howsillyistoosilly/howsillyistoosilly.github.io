import { memo, useEffect, useRef, useState } from 'react'
import './AccentManager.css'

export const SECTION_ACCENTS = [
  { id: 'hero', label: 'core', hex: '#FB2C5A', rgb: '251 44 90' },
  { id: 'projects', label: 'games', hex: '#FF3366', rgb: '255 51 102' },
  { id: 'motion', label: 'motion', hex: '#00D2FF', rgb: '0 210 255' },
  { id: 'photos', label: 'visuals', hex: '#10B981', rgb: '16 185 129' },
  { id: 'about', label: 'about', hex: '#A855F7', rgb: '168 85 247' },
  { id: 'contact', label: 'connect', hex: '#F59E0B', rgb: '245 158 11' },
]

function AccentManagerComponent({ onSectionSelect }) {
  const [activeAccent, setActiveAccent] = useState(SECTION_ACCENTS[0])
  const [isFading, setIsFading] = useState(false)
  const prevAccentId = useRef(SECTION_ACCENTS[0].id)

  // Apply accent to CSS root variables and dispatch event
  const applyAccent = (accent) => {
    if (!accent || accent.id === prevAccentId.current) return
    prevAccentId.current = accent.id

    // Smooth text fade transition in the HUD
    setIsFading(true)
    setTimeout(() => {
      setActiveAccent(accent)
      setIsFading(false)
    }, 150)

    // Update CSS custom properties across the document
    const root = document.documentElement
    root.style.setProperty('--dvb-rose', accent.rgb)
    root.style.setProperty('--accent-hex', accent.hex)
    root.style.setProperty('--accent-rgb', accent.rgb)
    root.style.setProperty('--accent-glow', `rgba(${accent.rgb}, 0.28)`)
    root.style.setProperty('--accent-subtle', `rgba(${accent.rgb}, 0.08)`)
    root.style.setProperty('--accent-border', `rgba(${accent.rgb}, 0.35)`)
    root.dataset.activeTheme = accent.id

    // Notify canvas background and components
    window.dispatchEvent(
      new CustomEvent('accentchange', {
        detail: { rgb: accent.rgb, hex: accent.hex, id: accent.id, label: accent.label },
      })
    )
  }

  // Scroll tracking IntersectionObserver across all sections
  useEffect(() => {
    // Initial apply
    applyAccent(SECTION_ACCENTS[0])

    const sectionElements = SECTION_ACCENTS.map(item => ({
      id: item.id,
      el: document.getElementById(item.id),
      accent: item,
    })).filter(item => item.el !== null)

    if (sectionElements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Find visible section with highest intersection ratio or top-most active
        const visible = entries.filter(e => e.isIntersecting)
        if (visible.length === 0) return

        // Sort by intersection ratio or bounding top proximity to viewport middle
        visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        const targetId = visible[0].target.id
        const matched = SECTION_ACCENTS.find(a => a.id === targetId)
        if (matched) {
          applyAccent(matched)
        }
      },
      {
        root: null,
        rootMargin: '-20% 0px -40% 0px',
        threshold: [0.1, 0.3, 0.6],
      }
    )

    sectionElements.forEach(({ el }) => observer.observe(el))

    return () => {
      observer.disconnect()
    }
  }, [])

  const handlePipClick = (section) => {
    applyAccent(section)
    if (onSectionSelect) {
      onSectionSelect(section.id)
    } else {
      const el = document.getElementById(section.id)
      if (el) {
        if (window.__lenis) {
          window.__lenis.scrollTo(el, { offset: -30, duration: 1.2 })
        } else {
          el.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }
  }

  // Background accent manager returns null (HUD removed per user request)
  return null
}

export default memo(AccentManagerComponent)
