import { memo } from 'react'

function ContactSectionComponent() {
  return (
    <>
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

export default memo(ContactSectionComponent)
