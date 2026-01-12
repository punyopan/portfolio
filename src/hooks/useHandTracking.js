import { useEffect, useRef, useState, useCallback } from 'react'
import { useStore } from '../store'

/**
 * Hook for managing webcam and MediaPipe worker lifecycle.
 * Returns detection status and a method to get current video element.
 */
export function useHandTracking(webcamRef) {
  const workerRef = useRef(null)
  const requestRef = useRef()
  const lastVideoTimeRef = useRef(-1)
  
  const [isReady, setIsReady] = useState(false)
  
  const setSystemStatus = useStore((state) => state.setSystemStatus)

  const onResult = useRef(null)

  const setResultHandler = useCallback((handler) => {
    onResult.current = handler
  }, [])

  useEffect(() => {
    try {
      workerRef.current = new Worker('/hand-worker.js')
      
      workerRef.current.onmessage = (e) => {
        const { type, result, error } = e.data
        
        if (type === 'ready') {
          console.log('⚡ MediaPipe Worker Ready')
          setSystemStatus('READY')
          setIsReady(true)
          startDetectionLoop()
        } else if (type === 'result') {
          if (onResult.current) onResult.current(result)
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

  const startDetectionLoop = () => {
    const detectFrame = () => {
      const webcam = webcamRef.current
      
      if (webcam && webcam.video && webcam.video.readyState === 4) {
        const video = webcam.video
        
        if (video.videoWidth > 0 && video.videoHeight > 0) {
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
    
    detectFrame()
  }

  return { isReady, setResultHandler }
}
