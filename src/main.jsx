import React from 'react'
import ReactDOM from 'react-dom/client'
import ReactLenis from 'lenis/react'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode> 
     <ReactLenis
      root
      className="overflow-x-hidden w-screen"
      options={{
      lerp: 0.09,
      syncTouch: false,
      smoothWheel: true,
      // wheelMultiplier: 1.5,
      gestureOrientation: "vertical",
      easing: (t) => 1 - Math.pow(1 - t, 4),
      }}
    >
    <App />
</ReactLenis>
  </React.StrictMode>
)
