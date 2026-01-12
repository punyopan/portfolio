import { useEffect, useRef } from 'react'
import Webcam from 'react-webcam'
import { useStore } from '../store'

export default function HandManager() {
  const webcamRef = useRef(null)
  const workerRef = useRef(null)
  const requestRef = useRef()
  const lastVideoTimeRef = useRef(-1)
  
  const updateHand = useStore((state) => state.updateHand)
  const setHandPresent = useStore((state) => state.setHandPresent)

  const setSystemStatus = useStore((state) => state.setSystemStatus)

  useEffect(() => {
    try {
        // Initialize Classic Web Worker from public folder
        // Uses local libs to avoid importScripts/module issues
        workerRef.current = new Worker('/hand-worker.js')
        
        workerRef.current.onmessage = (e) => {
          const { type, result, error } = e.data
          
          if (type === 'ready') {
            console.log('⚡ MediaPipe Worker Ready')
            setSystemStatus('READY')
            // Start the detection loop once ready
            detectFrame()
          } else if (type === 'result') {
            handleResult(result)
          } else if (type === 'error') {
            console.error("Worker Error:", error)
            setSystemStatus('ERROR', error)
          }
        }
        
        workerRef.current.onerror = (e) => {
            console.error("Worker failed to load:", e)
            setSystemStatus('ERROR', "Worker Failed: " + e.message)
        }
        
        // Start initialization
        setSystemStatus('INITIALIZING')
        workerRef.current.postMessage({ action: 'init' })

    } catch (err) {
        setSystemStatus('ERROR', "Initialization Failed: " + err.message)
    }

    return () => {
      if (workerRef.current) workerRef.current.terminate()
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [])

  /* Improved loop to ensure video is ready */
  const detectFrame = () => {
    const webcam = webcamRef.current
    
    // Check if webcam is fully ready
    if (webcam && webcam.video && webcam.video.readyState === 4) {
       const video = webcam.video
       
       if (video.currentTime !== lastVideoTimeRef.current) {
         lastVideoTimeRef.current = video.currentTime
         
         createImageBitmap(video).then(bitmap => {
            if(workerRef.current) {
                workerRef.current.postMessage({ 
                    action: 'detect', 
                    payload: { image: bitmap, timestamp: performance.now() } 
                }, [bitmap]) 
            }
         }).catch(err => {
             console.warn("Bitmap creation failed", err)
         })
       }
    }
    
    requestRef.current = requestAnimationFrame(detectFrame)
  }

  const canvasRef = useRef(null)
  const debugMode = useStore((state) => state.debugMode)

  /* Gesture Detection Logic */
  const detectGestures = (landmarks) => {
    // Finger indices: [Thumb, Index, Middle, Ring, Pinky]
    // Tips: [4, 8, 12, 16, 20]
    // PIPs (Knuckles): [2, 6, 10, 14, 18] - Approx for simpler logic, usually MCP is better base
    // Use MCP for base comparison: [1, 5, 9, 13, 17]
    
    const wrist = landmarks[0]
    const tips = [4, 8, 12, 16, 20]
    const fingerBases = [1, 5, 9, 13, 17] // Thumb CMC, Index MCP, etc.
    
    // Check which fingers are extended
    // Simple logic: Tip is further from wrist than Base
    // Better logic: Tip is further from wrist than PIP/MCP in direction of finger
    // We'll use distance to wrist as a proxy for simple detection
    const isExtended = tips.map((tipIdx, i) => {
        const dTip = Math.hypot(landmarks[tipIdx].x - wrist.x, landmarks[tipIdx].y - wrist.y)
        const dBase = Math.hypot(landmarks[fingerBases[i]].x - wrist.x, landmarks[fingerBases[i]].y - wrist.y)
        // Heuristic: Extended if tip is significantly further than base
        // Thumb is tricky, handled separately usually, but stick to simple
        return dTip > (dBase * 1.5) // 1.5 multiplier rough heuristic
    })
    
    // Distances
    const distThumbIndex = Math.hypot(landmarks[4].x - landmarks[8].x, landmarks[4].y - landmarks[8].y)
    
    // 1. PINCH: Thumb + Index close, others extended or curled (doesn't matter much)
    if (distThumbIndex < 0.05) {
        return 'PINCH'
    }
    
    // 2. FIST: All curled
    if (isExtended.every(e => !e)) return 'FIST'
    
    // 3. OPEN PALM: All extended
    if (isExtended.every(e => e)) return 'OPEN_PALM'
    
    // 4. PEACE: Index + Middle extended, Ring + Pinky curled
    if (isExtended[1] && isExtended[2] && !isExtended[3] && !isExtended[4]) return 'PEACE'
    
    // 5. OK: Thumb + Index touching (Pinch check above, but OK implies others extended)
    // Refine Pinch: If others extended -> OK
    // Let's relax: Pinch wins if very close, but check logic
    // OK explicitly: Thumb-Index close AND Middle/Ring/Pinky extended
    if (distThumbIndex < 0.08 && isExtended[2] && isExtended[3] && isExtended[4]) return 'OK'
    
    return 'NONE'
  }

  const handleResult = (result) => {
    const { landmarks, worldLandmarks } = result
    
    if (landmarks && landmarks.length > 0) {
      // 1. Process Gestures for Primary Hand (Index 0)
      const primaryHand = landmarks[0]
      const gesture = detectGestures(primaryHand)
      
      // Calculate cursor position from primary hand
      const wrist = primaryHand[0]
      const indexMCP = primaryHand[5]
      const pinkyMCP = primaryHand[17]
      const centerX = (wrist.x + indexMCP.x + pinkyMCP.x) / 3
      const centerY = (wrist.y + indexMCP.y + pinkyMCP.y) / 3
      
      // Map to screen coordinates (-1 to 1) 
      // X is mirrored
      const targetX = (1 - centerX) * 2 - 1 
      const targetY = -(centerY * 2 - 1) 
      
      // Smoothing (Simple LERP)
      // Reduced smoothing here to minimize latency (we smooth visually in cursor)
      const smoothFactor = 0.5 
      // Initialize if needed (or just use 0,0 default)
      if (!window.lastHandPos) window.lastHandPos = { x: targetX, y: targetY }
      
      const x = window.lastHandPos.x + (targetX - window.lastHandPos.x) * smoothFactor
      const y = window.lastHandPos.y + (targetY - window.lastHandPos.y) * smoothFactor
      
      window.lastHandPos = { x, y }
      
      // --- SWIPE DETECTION ---
      const currentTime = Date.now()
      if (!window.lastSwipeTime) window.lastSwipeTime = 0
      
      // Calculate Velocity
      if (window.lastX !== undefined) {
          const deltaX = x - window.lastX
          // Time delta approx 33ms (30fps)
          // Simplified velocity: movement per frame
          
          const swipeThreshold = 0.15 // Adjust sensitivity
          const cooldown = 500 // 500ms between swipes
          
          if (currentTime - window.lastSwipeTime > cooldown) {
              if (deltaX > swipeThreshold) {
                  // Swipe RIGHT (Next)
                  console.log("SWIPE RIGHT")
                  useStore.getState().nextModel()
                  window.lastSwipeTime = currentTime 
              } else if (deltaX < -swipeThreshold) {
                  // Swipe LEFT (Prev)
                  console.log("SWIPE LEFT")
                  useStore.getState().prevModel()
                  window.lastSwipeTime = currentTime
              }
          }
      }
      window.lastX = x
      
      const payload = {
        handPresent: true,
        position: { x, y, z: 0 },
        gesture
      }
      
      // 2. Zoom Detection (Two Hands)
      if (landmarks.length >= 2) {
         const hand1 = landmarks[0][0] // Base of hand 1
         const hand2 = landmarks[1][0] // Base of hand 2
         
         // Calculate distance
         const separation = Math.hypot(hand1.x - hand2.x, hand1.y - hand2.y)
         // Map separation to zoom (0.1 separation -> 1.0 zoom, 0.8 separation -> 3.0 zoom?)
         // Simple linear mapping
         const zoom = Math.max(0.5, Math.min(3.0, separation * 4))
         
         payload.zoomLevel = zoom
         payload.gesture = 'ZOOM' // Override gesture state if zooming? Or separate? 
         // Let's keep specific hand gestures for primary but updates zoom too.
         // Or if separation changes rapidly? Just update zoom state.
      } else {
         payload.zoomLevel = 1.0 // Reset zoom if only one hand? Or keep last? 
         // Let's reset for now to be clear
      }
      
      updateHand(payload)
      
      // 3. Debug Drawing
       if (debugMode && canvasRef.current && webcamRef.current?.video) {
         drawDebug(landmarks)
       }
       
    } else {
       setHandPresent(false)
       if (debugMode && canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d')
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
       }
    }
  }

  const drawDebug = (multiLandmarks) => {
      const video = webcamRef.current.video
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      ctx.save()
      ctx.scale(-1, 1) // Mirror
      ctx.translate(-canvas.width, 0)
      
      multiLandmarks.forEach((landmarks, index) => {
          ctx.beginPath()
          ctx.lineWidth = 2
          ctx.strokeStyle = index === 0 ? '#00f3ff' : '#ff00ff'
          ctx.fillStyle = index === 0 ? '#00f3ff' : '#ff00ff'
          
          for (const point of landmarks) {
              ctx.beginPath()
              ctx.arc(point.x * canvas.width, point.y * canvas.height, 4, 0, 2 * Math.PI)
              ctx.fill()
          }
      })
      
      ctx.restore()
  }

  return (
    <div className={`absolute inset-0 z-50 pointer-events-none flex items-center justify-center transition-opacity duration-500 ${debugMode ? 'opacity-100' : 'opacity-0'}`}>
       <div className="relative border border-cyber-cyan/30 rounded-lg overflow-hidden backdrop-blur-sm bg-black/50">
          <Webcam
            ref={webcamRef}
            width={640}
            height={480}
            mirrored={true}
            screenshotFormat="image/jpeg"
            videoConstraints={{
                width: 640,
                height: 480,
                facingMode: "user"
            }}
            className="opacity-80"
          />
          <canvas 
            ref={canvasRef}
            className="absolute inset-0 w-full h-full transform -scale-x-100" // Mirror canvas via CSS to match mirrored video
          />
       </div>
    </div>
  )
}
