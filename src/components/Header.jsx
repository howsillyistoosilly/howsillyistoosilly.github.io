import { memo } from 'react'

function HeaderComponent({ onNavigateToBlog, onNavigateToMotion }) {
  return (
    <header className="dvb-header">
      <a href="/" className="dvb-logo" aria-label="howsillyistoosilly">
        <img className="dvb-logo-mark" src="/silly-cat.svg" alt="" />
        <span>howsillyistoosilly</span>
      </a>

      <nav className="dvb-nav-pills" aria-label="Social and page links">
        <a
          href="#projects"
          className="dvb-pill-btn"
          aria-label="View work"
        >
          <span>work</span>
        </a>

        <a
          href="https://github.com/howsillyistoosilly"
          target="_blank"
          rel="noopener noreferrer"
          className="dvb-pill-btn"
          aria-label="GitHub Profile"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          <span>github</span>
        </a>

        <a
          href="https://howsillyistoosilly.itch.io"
          target="_blank"
          rel="noopener noreferrer"
          className="dvb-pill-btn"
          aria-label="itch.io games"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M2.5 5.5A1.5 1.5 0 0 1 4 4h16a1.5 1.5 0 0 1 1.5 1.5c0 .32-.1.62-.28.87L18.8 9.5H5.2L2.78 6.37A1.49 1.49 0 0 1 2.5 5.5zM4 11h16v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7zm5 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
          </svg>
          <span>itch.io</span>
        </a>

        <button
          type="button"
          onClick={onNavigateToMotion}
          className="dvb-pill-btn"
          aria-label="Motion Gallery"
        >
          <span>motion</span>
        </button>

        <button
          type="button"
          onClick={onNavigateToBlog}
          className="dvb-pill-btn dvb-pill-btn--accent"
          aria-label="Read Blog"
        >
          <span>blog ↗</span>
        </button>
      </nav>
    </header>
  )
}

export default memo(HeaderComponent)
