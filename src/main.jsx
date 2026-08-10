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
        lerp: 0.14,
        duration: 0.9,
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.5,
        gestureOrientation: 'vertical',
      }}
    >
    <App />
</ReactLenis>
  </React.StrictMode>
)
