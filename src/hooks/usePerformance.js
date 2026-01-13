import { useEffect, useRef } from 'react'
import { useStore } from '../store'

/**
 * FPS monitor hook with auto-detection for low-spec devices.
 * Auto-switches to low-perf mode when FPS drops below threshold.
 */
export function usePerformance() {
  const frameTimesRef = useRef([])
  const lastTimeRef = useRef(performance.now())
  const lowFpsCountRef = useRef(0)
  
  const performanceMode = useStore((s) => s.performanceMode)
  const lowPerfActive = useStore((s) => s.lowPerfActive)
  const setLowPerfActive = useStore((s) => s.setLowPerfActive)
  
  useEffect(() => {
    if (performanceMode === 'high') {
      setLowPerfActive(false)
      return
    }
    if (performanceMode === 'low') {
      setLowPerfActive(true)
      return
    }
    
    // Auto mode: monitor FPS
    let rafId
    const FPS_THRESHOLD = 30
    const LOW_FPS_TRIGGER_COUNT = 90 // ~3 seconds at 30fps
    const RECOVERY_COUNT = 150 // ~5 seconds of good FPS to recover
    
    const measure = () => {
      const now = performance.now()
      const delta = now - lastTimeRef.current
      lastTimeRef.current = now
      
      // Calculate instantaneous FPS
      const fps = 1000 / delta
      
      // Keep rolling window of 30 frames
      frameTimesRef.current.push(fps)
      if (frameTimesRef.current.length > 30) {
        frameTimesRef.current.shift()
      }
      
      // Calculate average FPS
      const avgFps = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length
      
      // Update store FPS for display
      useStore.getState().setCurrentFps(Math.round(avgFps))
      
      // Auto-detection logic
      if (avgFps < FPS_THRESHOLD) {
        lowFpsCountRef.current++
        if (lowFpsCountRef.current > LOW_FPS_TRIGGER_COUNT && !lowPerfActive) {
          console.log('⚡ Auto-switching to low performance mode (FPS:', Math.round(avgFps), ')')
          setLowPerfActive(true)
        }
      } else {
        // Good FPS - count towards recovery
        if (lowPerfActive) {
          lowFpsCountRef.current--
          if (lowFpsCountRef.current < -RECOVERY_COUNT) {
            console.log('⚡ Performance recovered, switching to high mode')
            setLowPerfActive(false)
            lowFpsCountRef.current = 0
          }
        } else {
          lowFpsCountRef.current = Math.max(0, lowFpsCountRef.current - 1)
        }
      }
      
      rafId = requestAnimationFrame(measure)
    }
    
    rafId = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(rafId)
  }, [performanceMode, lowPerfActive, setLowPerfActive])
  
  return { lowPerfActive, performanceMode }
}

/**
 * Simple hook to get performance state without monitoring.
 * Use this in components that just need to read the state.
 */
export function usePerformanceState() {
  const lowPerfActive = useStore((s) => s.lowPerfActive)
  const performanceMode = useStore((s) => s.performanceMode)
  const currentFps = useStore((s) => s.currentFps)
  const setPerformanceMode = useStore((s) => s.setPerformanceMode)
  
  return { lowPerfActive, performanceMode, currentFps, setPerformanceMode }
}
