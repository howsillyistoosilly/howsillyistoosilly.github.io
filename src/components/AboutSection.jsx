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
          <p> hihiii my name is adarsh (howsillyistoosilly) and i love creating stuff and learning new things. i was brought up around computers and now am doing my part to contribute to the digital world  <br /> other than that i love listening to music, learning how to draw and play the guitar among a pile of other hobbies and also love watching movies </p>
        </div>
      </div>
    </div>
  )
}

export default memo(AboutSectionComponent)
