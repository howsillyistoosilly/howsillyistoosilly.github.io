import { memo } from 'react'

function NavbarComponent({ onNavigateToBlog, onNavigateToMotion, onNavigateHome }) {
  const handleBlogClick = (e) => {
    e.preventDefault()
    if (onNavigateToBlog) {
      onNavigateToBlog()
    }
  }

  const handleMotionClick = (e) => {
    if (onNavigateToMotion) {
      // If we are not on home, prevent default and navigate home then scroll, or open gallery
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        e.preventDefault()
        onNavigateToMotion()
      }
    }
  }

  const handleLogoClick = (e) => {
    if (onNavigateHome && typeof window !== 'undefined' && window.location.pathname !== '/') {
      e.preventDefault()
      onNavigateHome()
    }
  }

  return (
    <nav>
      <div
        className="logo"
        onClick={handleLogoClick}
        style={{ cursor: 'pointer' }}
      >
        howsillyistoosilly
      </div>
      <ul>
        <li><a href="#projects">projects</a></li>
        <li><a href="#motion" onClick={handleMotionClick}>motion</a></li>
        <li><a href="#photos">photos</a></li>
        <li><a href="/blog" onClick={handleBlogClick}>blog</a></li>
        <li><a href="#about">about</a></li>
        <li><a href="#contact">contact</a></li>
      </ul>
    </nav>
  )
}

export default memo(NavbarComponent)

