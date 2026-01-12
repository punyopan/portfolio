import { useRef, useEffect } from 'react'
import { useStore } from '../store'

/**
 * Canvas component for drawing debug hand landmarks.
 */
export default function DebugCanvas({ webcamRef, landmarks }) {
  const canvasRef = useRef(null)
  const debugMode = useStore((state) => state.debugMode)

  useEffect(() => {
    if (!debugMode || !canvasRef.current || !webcamRef.current?.video || !landmarks) {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
      return
    }
    
    const video = webcamRef.current.video
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    ctx.save()
    ctx.scale(-1, 1)
    ctx.translate(-canvas.width, 0)
    
    landmarks.forEach((hand, index) => {
      ctx.fillStyle = index === 0 ? '#00f3ff' : '#ff00ff'
      
      for (const point of hand) {
        ctx.beginPath()
        ctx.arc(point.x * canvas.width, point.y * canvas.height, 4, 0, 2 * Math.PI)
        ctx.fill()
      }
    })
    
    ctx.restore()
  }, [debugMode, landmarks, webcamRef])

  return (
    <canvas 
      ref={canvasRef}
      className="absolute inset-0 w-full h-full transform -scale-x-100"
    />
  )
}
