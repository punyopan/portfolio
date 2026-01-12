import { useRef, useCallback } from 'react'
import { useStore } from '../store'

/**
 * Hook for gesture detection and swipe recognition.
 * Process hand landmarks and return gesture + swipe actions.
 */
export function useGestureRecognition() {
  const lastHandPosRef = useRef({ x: 0, y: 0 })
  const lastSwipeTimeRef = useRef(0)
  const lastXRef = useRef(null)
  
  const updateHand = useStore((state) => state.updateHand)
  const setHandPresent = useStore((state) => state.setHandPresent)

  const detectGestures = useCallback((landmarks) => {
    const wrist = landmarks[0]
    const tips = [4, 8, 12, 16, 20]
    const fingerBases = [1, 5, 9, 13, 17]
    
    const isExtended = tips.map((tipIdx, i) => {
      const dTip = Math.hypot(landmarks[tipIdx].x - wrist.x, landmarks[tipIdx].y - wrist.y)
      const dBase = Math.hypot(landmarks[fingerBases[i]].x - wrist.x, landmarks[fingerBases[i]].y - wrist.y)
      return dTip > (dBase * 1.5)
    })
    
    const distThumbIndex = Math.hypot(landmarks[4].x - landmarks[8].x, landmarks[4].y - landmarks[8].y)
    
    if (distThumbIndex < 0.05) return 'PINCH'
    if (isExtended.every(e => !e)) return 'FIST'
    if (isExtended.every(e => e)) return 'OPEN_PALM'
    if (isExtended[1] && isExtended[2] && !isExtended[3] && !isExtended[4]) return 'PEACE'
    if (distThumbIndex < 0.08 && isExtended[2] && isExtended[3] && isExtended[4]) return 'OK'
    
    return 'NONE'
  }, [])

  const processLandmarks = useCallback((result) => {
    const { landmarks } = result
    
    if (landmarks && landmarks.length > 0) {
      const primaryHand = landmarks[0]
      const gesture = detectGestures(primaryHand)
      
      const wrist = primaryHand[0]
      const indexMCP = primaryHand[5]
      const pinkyMCP = primaryHand[17]
      const centerX = (wrist.x + indexMCP.x + pinkyMCP.x) / 3
      const centerY = (wrist.y + indexMCP.y + pinkyMCP.y) / 3
      
      const targetX = (1 - centerX) * 2 - 1 
      const targetY = -(centerY * 2 - 1) 
      
      const smoothFactor = 0.5 
      const x = lastHandPosRef.current.x + (targetX - lastHandPosRef.current.x) * smoothFactor
      const y = lastHandPosRef.current.y + (targetY - lastHandPosRef.current.y) * smoothFactor
      
      lastHandPosRef.current = { x, y }
      
      // Swipe Detection
      const currentTime = Date.now()
      
      if (lastXRef.current !== null) {
        const deltaX = x - lastXRef.current
        const swipeThreshold = 0.15
        const cooldown = 500
        
        if (currentTime - lastSwipeTimeRef.current > cooldown) {
          if (deltaX > swipeThreshold) {
            console.log("SWIPE RIGHT")
            useStore.getState().nextModel()
            lastSwipeTimeRef.current = currentTime 
          } else if (deltaX < -swipeThreshold) {
            console.log("SWIPE LEFT")
            useStore.getState().prevModel()
            lastSwipeTimeRef.current = currentTime
          }
        }
      }
      lastXRef.current = x
      
      const payload = {
        handPresent: true,
        position: { x, y, z: 0 },
        gesture
      }
      
      // Zoom Detection (Two Hands)
      if (landmarks.length >= 2) {
        const hand1 = landmarks[0][0]
        const hand2 = landmarks[1][0]
        const separation = Math.hypot(hand1.x - hand2.x, hand1.y - hand2.y)
        const zoom = Math.max(0.5, Math.min(3.0, separation * 4))
        
        payload.zoomLevel = zoom
        payload.gesture = 'ZOOM'
      } else {
        payload.zoomLevel = 1.0
      }
      
      updateHand(payload)
      return { hasHand: true, gesture, position: { x, y } }
       
    } else {
      setHandPresent(false)
      return { hasHand: false, gesture: 'NONE', position: null }
    }
  }, [detectGestures, updateHand, setHandPresent])

  return { processLandmarks }
}
