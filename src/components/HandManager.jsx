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
  
  const [isVideoReady, setIsVideoReady] = useState(false)
  
  const updateHand = useStore((state) => state.updateHand)
  const setHandPresent = useStore((state) => state.setHandPresent)
  const setSystemStatus = useStore((state) => state.setSystemStatus)
  const debugMode = useStore((state) => state.debugMode)

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
      workerRef.current.postMessage({ action: 'init' })

    } catch (err) {
      setSystemStatus('ERROR', "Initialization Failed: " + err.message)
    }

    return () => {
      if (workerRef.current) workerRef.current.terminate()
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [])

  const detectFrame = () => {
    const webcam = webcamRef.current
    
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
    
    if (distThumbIndex < 0.05) return 'PINCH'
    if (isExtended.every(e => !e)) return 'FIST'
    if (isExtended.every(e => e)) return 'OPEN_PALM'
    if (isExtended[1] && isExtended[2] && !isExtended[3] && !isExtended[4]) return 'PEACE'
    if (distThumbIndex < 0.08 && isExtended[2] && isExtended[3] && isExtended[4]) return 'OK'
    
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

  return (
    <div className={`absolute inset-0 z-50 pointer-events-none flex items-center justify-center transition-opacity duration-500 ${debugMode ? 'opacity-100' : 'opacity-0'}`}>
      <div className="relative border border-cyber-cyan/30 rounded-lg overflow-hidden backdrop-blur-sm bg-black/50">
        <Webcam
          ref={webcamRef}
          width={640}
          height={480}
          mirrored={true}
          screenshotFormat="image/jpeg"
          onUserMedia={onUserMedia}
          videoConstraints={{
            width: 640,
            height: 480,
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
