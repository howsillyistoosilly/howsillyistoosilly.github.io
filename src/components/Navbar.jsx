import { memo } from 'react'

function NavbarComponent() {
  return (
    <nav>
      <div className="logo">howsillyistoosilly</div>
      <ul>
        <li><a href="#projects">projects</a></li>
        <li><a href="#motion">motion</a></li>
        <li><a href="#photos">potos</a></li>
        <li><a href="#about">about</a></li>
        <li><a href="#contact">contact</a></li>
      </ul>
    </nav>
  )
}

export default memo(NavbarComponent)
