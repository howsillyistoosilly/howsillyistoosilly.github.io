import { memo } from 'react'
import GridDivider from './GridDivider'

function FooterComponent({ onNavigateToBlog, onNavigateToMotion }) {
  const scrollToTop = () => {
    if (window.__lenis) {
      window.__lenis.scrollTo(0, { duration: 1.2 })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <footer className="dvb-footer">
      <GridDivider top />

      <div>
        <a href="mailto:adarshsatish06@gmail.com" className="dvb-email-link">
          adarshsatish06@gmail.com
        </a>
      </div>

      <div>
        <span>© 2026 Adarsh Satish · @howsillyistoosilly</span>
      </div>

      <nav className="dvb-footer-nav" aria-label="Footer Navigation">
        <button type="button" onClick={onNavigateToBlog}>
          blog
        </button>
        <button type="button" onClick={onNavigateToMotion}>
          motion
        </button>
        <button type="button" onClick={scrollToTop}>
          top ↑
        </button>
      </nav>
    </footer>
  )
}

export default memo(FooterComponent)
