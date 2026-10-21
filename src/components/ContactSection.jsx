import { memo } from 'react'
import GridDivider from './GridDivider'

function ContactSectionComponent() {
  return (
    <section className="dvb-section" id="contact">
      <GridDivider top />

      <div className="dvb-sec-head">
        <h2 className="dvb-sec-title">let's talk.</h2>
        <p className="dvb-sec-desc">
          bring what you're working on. open for collabs, game jams, or just a friendly chat.
        </p>
      </div>

      <div className="dvb-contact-grid">
        <a
          href="mailto:adarshsatish06@gmail.com"
          className="dvb-contact-card group"
          aria-label="Send an email to Adarsh"
        >
          <span>email</span>
          <svg width="12" height="12" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M1 9L9 1M9 1H3M9 1V7" />
          </svg>
        </a>

        <a
          href="https://howsillyistoosilly.itch.io"
          target="_blank"
          rel="noopener noreferrer"
          className="dvb-contact-card group"
          aria-label="Visit itch.io profile"
        >
          <span>itch.io</span>
          <svg width="12" height="12" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M1 9L9 1M9 1H3M9 1V7" />
          </svg>
        </a>

        <a
          href="https://github.com/howsillyistoosilly"
          target="_blank"
          rel="noopener noreferrer"
          className="dvb-contact-card group"
          aria-label="Visit GitHub profile"
        >
          <span>github</span>
          <svg width="12" height="12" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M1 9L9 1M9 1H3M9 1V7" />
          </svg>
        </a>

        <a
          href="https://www.linkedin.com/in/adarsh-satish-050aa12b9/"
          target="_blank"
          rel="noopener noreferrer"
          className="dvb-contact-card group"
          aria-label="Visit LinkedIn profile"
        >
          <span>linkedin</span>
          <svg width="12" height="12" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M1 9L9 1M9 1H3M9 1V7" />
          </svg>
        </a>
      </div>
    </section>
  )
}

export default memo(ContactSectionComponent)
