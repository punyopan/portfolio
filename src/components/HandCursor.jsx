import { useStore } from '../store'
import { useRef, useEffect } from 'react'

export default function HandCursor() {
  const { position, gesture, handPresent } = useStore()
  const cursorRef = useRef(null)

  // Use requestAnimationFrame for smooth UI updates outside React render cycle if possible, 
  // but since store updates trigger re-renders, we can just use style prop or useEffect.
  // Ideally, useStore.subscribe would be faster, but let's stick to simple React binding first.
  // For 60fps, direct ref manipulation is better.
  
  // Visual Smoothing (60fps LERP)
  const targetPos = useRef({ x: 0, y: 0 })
  const currentPos = useRef({ x: 0, y: 0 })
  const frameRef = useRef()

  useEffect(() => {
    // 1. Subscribe to store for Logic & Target Updates
    let lastGesture = 'NONE'
    
    const unsub = useStore.subscribe(state => {
        if (!state.handPresent) {
            if (cursorRef.current) cursorRef.current.style.opacity = 0
            return
        }
        
        const { position, gesture } = state
        
        // CLICK DETECTION (Rising Edge of PINCH)
        if (gesture === 'PINCH' && lastGesture !== 'PINCH') {
            // Trigger Click at CURRENT visually smoothed position
            // We use the ref 'currentPos' which holds the % coordinates
            const x = window.innerWidth * (currentPos.current.x / 100)
            const y = window.innerHeight * (currentPos.current.y / 100)
            
            // Hide cursor momentarily to click 'under' it (if pointer-events:none didn't work, but it does)
            // But usually pointer-events: none on cursor is set, so we click through.
            const element = document.elementFromPoint(x, y)
            
            if (element) {
                console.log("Virtual Click on:", element)
                element.click()
                
                // Visual Click Feedback
                if (cursorRef.current) {
                    const ripple = document.createElement('div')
                    ripple.className = 'absolute inset-0 rounded-full border-2 border-white animate-ping opacity-75'
                    cursorRef.current.appendChild(ripple)
                    setTimeout(() => ripple.remove(), 500)
                }
            }
        }
        lastGesture = gesture
        
        // Map Position to Target (for smoothing loop)
        // X: -1..1 -> 0..100%
        const left = (position.x + 1) / 2 * 100
        const top = (1 - position.y) / 2 * 100 
        
        targetPos.current = { x: left, y: top }
        
        // Update opacity/scale immediately (no need to smooth strictly)
        if (cursorRef.current) {
            cursorRef.current.style.opacity = 1
            cursorRef.current.style.transform = `translate(-50%, -50%) scale(${gesture === 'PINCH' || gesture === 'FIST' ? 0.8 : 1})`
        }
    })

    // 2. Animation Loop (High frequency 60fps)
    const animate = () => {
        // LERP current -> target
        // Factor 0.15 at 60fps = VERY smooth
        const factor = 0.15 
        currentPos.current.x += (targetPos.current.x - currentPos.current.x) * factor
        currentPos.current.y += (targetPos.current.y - currentPos.current.y) * factor
        
        if (cursorRef.current) {
            cursorRef.current.style.left = `${currentPos.current.x}%`
            cursorRef.current.style.top = `${currentPos.current.y}%`
        }
        
        frameRef.current = requestAnimationFrame(animate)
    }
    
    // Start loop
    frameRef.current = requestAnimationFrame(animate)

    return () => {
        unsub()
        cancelAnimationFrame(frameRef.current)
    }
  }, [])

  const getIcon = () => {
      switch (gesture) {
          case 'FIST': return '✊'
          case 'PINCH': return '🤏'
          case 'PEACE': return '✌️'
          case 'OK': return '👌'
          case 'OPEN_PALM': return '🖐️'
          case 'POINTING': return '☝️'
          default: return 'cursor' // Fallback
      }
  }

  return (
    <div 
        ref={cursorRef}
        className="fixed z-[1000] pointer-events-none transition-opacity duration-300 will-change-transform"
        style={{ left: '50%', top: '50%', opacity: 0 }}
    >
        {/* Cursor Graphic */}
        <div className="relative flex items-center justify-center">
            {/* Outer Ring */}
            <div className={`absolute w-12 h-12 rounded-full border-2 border-primary/50 animate-pulse-fast ${gesture !== 'OPEN_PALM' ? 'scale-110 border-accent' : ''}`}></div>
            
            {/* Icon */}
            <div className="text-2xl drop-shadow-[0_0_10px_rgba(0,243,255,0.8)] filter">
                {getIcon()}
            </div>
            
            {/* Trailing or geometric elements can be added here */}
        </div>
    </div>
  )
}
