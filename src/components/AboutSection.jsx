import { memo } from 'react'

function AboutSectionComponent() {
  return (
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
  )
}

export default memo(AboutSectionComponent)
