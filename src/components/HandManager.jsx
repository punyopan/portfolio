import { useEffect, useRef, useState } from 'react'
import Webcam from 'react-webcam'
import { useStore } from '../store'

export default function HandManager() {
  const webcamRef = useRef(null)
  const workerRef = useRef(null)
  const requestRef = useRef()
  const lastVideoTimeRef = useRef(-1)
  const canvasRef = useRef(null)
  
  // Refs to replace window.* globals
  const lastHandPosRef = useRef({ x: 0, y: 0 })
  const lastSwipeTimeRef = useRef(0)
  const lastXRef = useRef(null)
  const lastFrameTimeRef = useRef(null)
  
  // Smart swipe recovery system
  const swipeStartPosRef = useRef(null) // Position where current swipe gesture started
  const swipeDirectionRef = useRef(null) // 'left' | 'right' | null - last swipe direction
  
  // Performance throttling
  const frameCountRef = useRef(0)
  
  const [isVideoReady, setIsVideoReady] = useState(false)
  
  const updateHand = useStore((state) => state.updateHand)
  const setHandPresent = useStore((state) => state.setHandPresent)
  const setSystemStatus = useStore((state) => state.setSystemStatus)
  const debugMode = useStore((state) => state.debugMode)
  const lowPerfActive = useStore((state) => state.lowPerfActive)

  useEffect(() => {
    try {
      workerRef.current = new Worker('/hand-worker.js')
      
      workerRef.current.onmessage = (e) => {
        const { type, result, error } = e.data
        
        if (type === 'ready') {
          console.log('⚡ MediaPipe Worker Ready')
          setSystemStatus('READY')
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
      
      setSystemStatus('INITIALIZING')
      // Pass lowPerfActive to worker for CPU fallback and reduced hands
      workerRef.current.postMessage({ action: 'init', lowPerf: lowPerfActive })

    } catch (err) {
      setSystemStatus('ERROR', "Initialization Failed: " + err.message)
    }

    return () => {
      if (workerRef.current) workerRef.current.terminate()
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [lowPerfActive]) // Re-init worker when performance mode changes

  const detectFrame = () => {
    const webcam = webcamRef.current
    
    // Frame throttling in low-perf mode - skip every 2nd frame
    frameCountRef.current++
    const lowPerf = useStore.getState().lowPerfActive
    const FRAME_SKIP = lowPerf ? 2 : 1
    
    if (frameCountRef.current % FRAME_SKIP !== 0) {
      requestRef.current = requestAnimationFrame(detectFrame)
      return
    }
    
    if (webcam && webcam.video && webcam.video.readyState === 4) {
      const video = webcam.video
      
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        if (!isVideoReady) setIsVideoReady(true)

        if (video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime
          
          try {
            createImageBitmap(video).then(bitmap => {
              if (workerRef.current) {
                workerRef.current.postMessage({ 
                  action: 'detect', 
                  payload: { image: bitmap, timestamp: performance.now() } 
                }, [bitmap]) 
              } else {
                bitmap.close()
              }
            }).catch(() => {})
          } catch (e) {}
        }
      }
    }
    
    requestRef.current = requestAnimationFrame(detectFrame)
  }

  const onUserMedia = () => {
    console.log("📷 Webcam Stream Ready")
    setIsVideoReady(true)
  }

  const detectGestures = (landmarks) => {
    const wrist = landmarks[0]
    const tips = [4, 8, 12, 16, 20]
    const fingerBases = [1, 5, 9, 13, 17]
    
    const isExtended = tips.map((tipIdx, i) => {
      const dTip = Math.hypot(landmarks[tipIdx].x - wrist.x, landmarks[tipIdx].y - wrist.y)
      const dBase = Math.hypot(landmarks[fingerBases[i]].x - wrist.x, landmarks[fingerBases[i]].y - wrist.y)
      return dTip > (dBase * 1.5)
    })
    
    const distThumbIndex = Math.hypot(landmarks[4].x - landmarks[8].x, landmarks[4].y - landmarks[8].y)
    
    if (distThumbIndex < 0.05) return 'PINCH' // Tighter threshold for less false positives
    if (isExtended.every(e => !e)) return 'FIST'
    if (isExtended.every(e => e)) return 'OPEN_PALM'
    if (isExtended[1] && isExtended[2] && !isExtended[3] && !isExtended[4]) return 'PEACE'
    
    return 'NONE'
  }

  const handleResult = (result) => {
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
      
      const smoothFactor = 0.3 // Lower = more smoothing, less jitter
      const x = lastHandPosRef.current.x + (targetX - lastHandPosRef.current.x) * smoothFactor
      const y = lastHandPosRef.current.y + (targetY - lastHandPosRef.current.y) * smoothFactor
      
      lastHandPosRef.current = { x, y }
      
      // SMART SWIPE DETECTION with Position-Based Recovery
      const currentTime = Date.now()
      const distanceThreshold = 0.2
      const velocityThreshold = 0.006
      const cooldown = 400
      const recoveryDistance = 0.15 // Must return this close to start position
      
      // Calculate velocity
      const timeDelta = lastFrameTimeRef.current ? currentTime - lastFrameTimeRef.current : 33
      lastFrameTimeRef.current = currentTime
      
      const cooldownPassed = currentTime - lastSwipeTimeRef.current > cooldown
      
      // Track start of movement (when we first see significant velocity)
      if (lastXRef.current !== null) {
        const instantDelta = x - lastXRef.current
        const instantVelocity = Math.abs(instantDelta) / Math.max(timeDelta, 1)
        
        // If we're moving fast and don't have a start position, record it
        if (instantVelocity > 0.003 && swipeStartPosRef.current === null) {
          swipeStartPosRef.current = lastXRef.current
          console.log(`SWIPE START recorded at: ${swipeStartPosRef.current.toFixed(2)}`)
        }
      }
      
      // Check recovery: Did we return near the start position?
      if (swipeStartPosRef.current !== null && swipeDirectionRef.current !== null) {
        const distFromStart = Math.abs(x - swipeStartPosRef.current)
        if (distFromStart < recoveryDistance) {
          console.log(`RECOVERY COMPLETE - returned to start zone`)
          swipeDirectionRef.current = null
          swipeStartPosRef.current = null
        }
      }
      
      // Swipe detection
      if (swipeStartPosRef.current !== null && cooldownPassed && gesture === 'OPEN_PALM') {
        const deltaFromStart = x - swipeStartPosRef.current
        const velocity = Math.abs(deltaFromStart) / Math.max(timeDelta, 1)
        
        const isFarEnough = Math.abs(deltaFromStart) > distanceThreshold
        const isFastEnough = velocity > velocityThreshold
        
        // Can only swipe if NOT same direction as last swipe (or recovered)
        if (isFarEnough && isFastEnough) {
          const direction = deltaFromStart > 0 ? 'right' : 'left'
          
          if (swipeDirectionRef.current !== direction) {
            if (direction === 'right') {
              console.log(`SWIPE LEFT (from ${swipeStartPosRef.current.toFixed(2)} to ${x.toFixed(2)})`)
              useStore.getState().prevModel()
            } else {
              console.log(`SWIPE RIGHT (from ${swipeStartPosRef.current.toFixed(2)} to ${x.toFixed(2)})`)
              useStore.getState().nextModel()
            }
            lastSwipeTimeRef.current = currentTime
            swipeDirectionRef.current = direction
            // Keep swipeStartPosRef so we know where to return to
          }
        }
      }
      
      // Update baseline for velocity calculation
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
    ctx.scale(-1, 1)
    ctx.translate(-canvas.width, 0)
    
    multiLandmarks.forEach((landmarks, index) => {
      ctx.fillStyle = index === 0 ? '#00f3ff' : '#ff00ff'
      
      for (const point of landmarks) {
        ctx.beginPath()
        ctx.arc(point.x * canvas.width, point.y * canvas.height, 4, 0, 2 * Math.PI)
        ctx.fill()
      }
    })
    
    ctx.restore()
  }

  // Dynamic resolution based on performance mode
  const videoWidth = lowPerfActive ? 320 : 640
  const videoHeight = lowPerfActive ? 240 : 480

  return (
    <div className={`absolute inset-0 z-50 pointer-events-none flex items-center justify-center transition-opacity duration-500 ${debugMode ? 'opacity-100' : 'opacity-0'}`}>
      <div className="relative border border-cyber-cyan/30 rounded-lg overflow-hidden backdrop-blur-sm bg-black/50">
        <Webcam
          ref={webcamRef}
          width={videoWidth}
          height={videoHeight}
          mirrored={true}
          screenshotFormat="image/jpeg"
          onUserMedia={onUserMedia}
          videoConstraints={{
            width: videoWidth,
            height: videoHeight,
            facingMode: "user"
          }}
          className="opacity-80"
        />
        <canvas 
          ref={canvasRef}
          className="absolute inset-0 w-full h-full transform -scale-x-100"
        />
      </div>
    </div>
  )
}
