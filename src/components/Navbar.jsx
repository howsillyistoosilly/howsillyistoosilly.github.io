import { memo } from 'react'

function NavbarComponent({ onNavigateToBlog }) {
  const handleBlogClick = (e) => {
    e.preventDefault()
    if (onNavigateToBlog) {
      onNavigateToBlog()
    }
  }

  return (
    <nav>
      <div className="logo">howsillyistoosilly</div>
      <ul>
        <li><a href="#projects">projects</a></li>
        <li><a href="#motion">motion</a></li>
        <li><a href="#photos">photos</a></li>
        <li><a href="/blog" onClick={handleBlogClick}>blog</a></li>
        <li><a href="#about">about</a></li>
        <li><a href="#contact">contact</a></li>
      </ul>
    </nav>
  )
}

export default memo(NavbarComponent)
