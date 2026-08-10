import { createContext, useContext, useEffect, useRef, useMemo } from 'react'

const ViewportContext = createContext(null)

export function ViewportProvider({ children }) {
  // Use Mutable Refs so high-frequency mouse/scroll updates do NOT trigger React render tree passes
  const mouseRef = useRef({
    x: 0,
    y: 0,
    normalizedX: 0, // -0.5 to 0.5
    normalizedY: 0, // -0.5 to 0.5
    targetX: 0,
    targetY: 0,
  })

  const scrollRef = useRef({
    y: 0,
    targetY: 0,
    progress: 0,
  })

  useEffect(() => {
    let mouseRafId = null

    const handlePointerMove = (e) => {
      mouseRef.current.targetX = e.clientX
      mouseRef.current.targetY = e.clientY
      
      const w = window.innerWidth || 1
      const h = window.innerHeight || 1
      
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY
      mouseRef.current.normalizedX = (e.clientX / w) - 0.5
      mouseRef.current.normalizedY = (e.clientY / h) - 0.5
    }

    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset
      const maxScroll = (document.documentElement.scrollHeight - window.innerHeight) || 1
      scrollRef.current.y = scrollY
      scrollRef.current.progress = Math.min(Math.max(scrollY / maxScroll, 0), 1)
    }

    window.addEventListener('mousemove', handlePointerMove, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handlePointerMove)
      window.removeEventListener('scroll', handleScroll)
      if (mouseRafId) cancelAnimationFrame(mouseRafId)
    }
  }, [])

  const value = useMemo(() => ({
    mouseRef,
    scrollRef,
  }), [])

  return (
    <ViewportContext.Provider value={value}>
      {children}
    </ViewportContext.Provider>
  )
}

export function useViewport() {
  const ctx = useContext(ViewportContext)
  if (!ctx) {
    throw new Error('useViewport must be used within a ViewportProvider')
  }
  return ctx
}
