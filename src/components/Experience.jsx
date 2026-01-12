import { OrbitControls, Environment, Sparkles } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store'
import { HyperShapeMaterial } from '../materials/HyperShapeMaterial'
import CyberTerminal from './CyberTerminal'
import GalaxyEnvironment from './GalaxyEnvironment'

import RobotModel from './RobotModel'
import AIModel from './AIModel'

export default function Experience() {
  const groupRef = useRef()
  const materialRef = useRef()
  
  // Connect to global store
  // NOTE: tracked 'position' removed to prevent re-renders. Accessed via getState in loop.
  const { gesture, handPresent, zoomLevel, currentModel } = useStore()
  
  // LERP references
  const targetPos = useRef(new THREE.Vector3(0, 0, 0))
  const targetDistort = useRef(0.4)
  const targetColor = useRef(new THREE.Color('#00f3ff'))

  useFrame((state, delta) => {
    if (!groupRef.current || !materialRef.current) return
    
    // Update Uniforms
    materialRef.current.uTime += delta
    
    // TARGET VALUES
    if (handPresent) {
        // Access position directly
        // Check if modal is open - if so, DISABLE 3D INTERACTIONS
        const isPortfolioOpen = useStore.getState().portfolioOpen
        const position = useStore.getState().position
        
        // Force 'IDLE' behavior if portfolio is open to prevent conflicts
        // This ensures gestures only control the UI (Cursor) when popup is visible
        const activeGesture = isPortfolioOpen ? 'NONE' : gesture
        
        // --- 1. FIST: DRAG PC ---
        if (activeGesture === 'FIST') {
            targetDistort.current = 1.0 
            targetColor.current.set('#ff0000') 
            // Map position to world space for dragging
            targetPos.current.set(position.x * 6, position.y * 4, 0)
            // Reset rotation to default or keep current? Let's just drag position.
        } 
        
        // --- 2. PINCH: ROTATE & CLICK ---
        else if (activeGesture === 'PINCH') {
             targetDistort.current = 0.0
             targetColor.current.set('#ffff00')
             
             // ROTATE: Map X position to Y rotation
             // Full screen width interaction: -1 to 1 -> -PI to PI
             groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, position.x * Math.PI, 0.1)
             
             // CLICK DETECTION (Logic needs state? using Ref for simplicity)
             if (!window.pinchStart) {
                 window.pinchStart = Date.now()
                 // Capture state at start of pinch
                 window.wasPortfolioOpen = useStore.getState().portfolioOpen
             }
        } 
        
        // --- 3. PEACE: FIREFLIES EFFECT ---
        else if (activeGesture === 'PEACE') {
             targetDistort.current = 0.5
             targetColor.current.set('#0000ff')
             targetPos.current.set(0, 0, 0) // Reset position? Or keep? Let's center it for the show.
             
             // Logic handled by Fireflies component checking store? 
             // Or update state here? 
             // Ideally we just set colors here. Effect component watches store.
        }
        
        // --- 4. OPEN_PALM / NONE: IDLE ---
        else {
             targetDistort.current = 0.2
             targetColor.current.set('#00ff44')
             // Don't follow hand. Return to center or float?
             // Let's float gently back to 0,0,0
             targetPos.current.set(0, 0, 0)
        }
        
        // Cleanup Click (if gesture changed from PINCH)
        if (activeGesture !== 'PINCH' && window.pinchStart) {
            const diff = Date.now() - window.pinchStart
            if (diff < 300) { // Short pinch < 300ms
                // ONLY open if it was CLOSED when we started pinching
                // This prevents reopening immediately after clicking 'close' in the UI
                if (!window.wasPortfolioOpen) {
                     console.log("CLICK DETECTED (3D)")
                     useStore.getState().setPortfolioOpen(true)
                }
            }
            window.pinchStart = null
        }
        
    } else {
        window.pinchStart = null
        // MOUSE FALLBACK / FACE TRACKING
        const { pointer } = state
        // Instead of moving position, we look at mouse
        // Map pointer X/Y (-1 to 1) to rotation angles
        targetPos.current.set(0, 0, 0) // Stay at center
        
        // Face the mouse
        const lookX = pointer.y * 0.5 // Up/Down
        const lookY = pointer.x * 0.5 // Left/Right
        
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, lookX, 0.1)
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, lookY, 0.1)
    }
    
    // LERP
    const targetScale = handPresent ? zoomLevel : 1.0
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
    
    groupRef.current.position.lerp(targetPos.current, 0.08) 
    materialRef.current.uDistort = THREE.MathUtils.lerp(materialRef.current.uDistort, targetDistort.current, 0.1)
    materialRef.current.uColor.lerp(targetColor.current, 0.1)
  })

  return (
    <>
      <GalaxyEnvironment />
      
      {gesture === 'PEACE' && (
        <Sparkles 
            count={200} 
            scale={[10, 2, 10]} 
            size={6} 
            speed={2} 
            opacity={0.8} 
            color="#ffaa00" 
            position={[0, -2, 0]} // From ground
        />
      )}
      
      <Environment preset="night" />
      
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

      <group ref={groupRef}>
          {currentModel === 0 && <CyberTerminal refContent={materialRef} />}
          {currentModel === 1 && <RobotModel active={true} />}
          {currentModel === 2 && <AIModel active={true} />}
      </group>
      

      
      <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
      
      {/* Post Processing */}
      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} radius={0.6} />
        <ChromaticAberration offset={[0.002, 0.002]} />
        <Noise opacity={0.05} blendFunction={BlendFunction.OVERLAY} />
      </EffectComposer>
    </>
  )
}

