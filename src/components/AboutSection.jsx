import { memo } from 'react'
import GridDivider from './GridDivider'

function AboutSectionComponent() {
  return (
    <section className="dvb-section" id="about">
      <GridDivider top />

      <div className="dvb-sec-head">
        <h2 className="dvb-sec-title">about.</h2>
        <p className="dvb-sec-desc">
          creative tech, background & philosophy.
        </p>
      </div>

      <div className="dvb-about-wrap">
        <div className="dvb-about-table">
          <div className="dvb-about-row">
            <span className="dvb-about-key">handle</span>
            <span className="dvb-about-val">howsillyistoosilly</span>
          </div>
          <div className="dvb-about-row">
            <span className="dvb-about-key">name</span>
            <span className="dvb-about-val">Adarsh Satish</span>
          </div>
          <div className="dvb-about-row">
            <span className="dvb-about-key">role</span>
            <span className="dvb-about-val">gameplay programmer</span>
          </div>
          <div className="dvb-about-row">
            <span className="dvb-about-key">lab</span>
            <span className="dvb-about-val">Next Tech Lab</span>
          </div>
          <div className="dvb-about-row">
            <span className="dvb-about-key">cert</span>
            <span className="dvb-about-val">Unity Jr. Programmer</span>
          </div>
          <div className="dvb-about-row">
            <span className="dvb-about-key">status</span>
            <span className="dvb-about-val" style={{ color: 'rgb(var(--dvb-rose))' }}>
              ● open to work
            </span>
          </div>
        </div>

        <div className="dvb-about-prose">
          <p>
            hihiii my name is adarsh (howsillyistoosilly). I love creating interactive worlds, designing game mechanics, and writing shaders for visual effects. Brought up around computers, I spend my days building stuff I find cool and things I find pretty.
          </p>
          <p>
            Outside of game engines and code editors, I love listening to music, learning how to draw and play the guitar, watching cinema, and collecting a pile of curious side hobbies.
          </p>
        </div>
      </div>
    </section>
  )
}

export default memo(AboutSectionComponent)
