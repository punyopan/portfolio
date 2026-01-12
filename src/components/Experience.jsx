import { OrbitControls, Environment, Sparkles } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store'
import { HyperShapeMaterial } from '../materials/HyperShapeMaterial'
import GamingSetupModel from './GamingSetupModel'
import GalaxyEnvironment from './GalaxyEnvironment'
import CustomModel from './CustomModel'
import AIModel from './AIModel'

// Helper component for carousel slide animation
const ModelSlide = ({ children, index, currentModel }) => {
  const ref = useRef()
  
  useFrame(() => {
    if (!ref.current) return
    
    // Calculate target X position based on index difference
    const targetX = (index - currentModel) * 12
    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, targetX, 0.1)
    
    // Scale down distant models
    const dist = Math.abs(index - currentModel)
    const targetScale = Math.max(0, 1 - dist * 0.3)
    ref.current.scale.setScalar(THREE.MathUtils.lerp(ref.current.scale.x, targetScale, 0.1))
    
    // Hide if too far
    ref.current.visible = targetScale > 0.05
  })

  return <group ref={ref}>{children}</group>
}

export default function Experience() {
  const groupRef = useRef()
  const materialRef = useRef()
  
  // Refs to replace window.* globals
  const pinchStartRef = useRef(null)
  const wasPortfolioOpenRef = useRef(false)
  
  // Connect to global store
  const { gesture, handPresent, zoomLevel, currentModel } = useStore()
  
  // LERP references
  const targetPos = useRef(new THREE.Vector3(0, 0, 0))
  const targetDistort = useRef(0.4)
  const targetColor = useRef(new THREE.Color('#00f3ff'))
  
  // Raycaster for click detection
  const raycaster = useRef(new THREE.Raycaster()).current

  useFrame((state, delta) => {
    if (!groupRef.current) return
    
    // Update Shader Uniforms
    if (materialRef.current) {
      materialRef.current.uTime += delta
      materialRef.current.uDistort = THREE.MathUtils.lerp(materialRef.current.uDistort, targetDistort.current, 0.1)
      materialRef.current.uColor.lerp(targetColor.current, 0.1)
    }
    
    // TARGET VALUES
    if (handPresent) {
      const isPortfolioOpen = useStore.getState().portfolioOpen
      const position = useStore.getState().position
      const activeGesture = isPortfolioOpen ? 'NONE' : gesture
      
      // --- 1. FIST: DRAG ---
      if (activeGesture === 'FIST') {
        targetDistort.current = 1.0 
        targetColor.current.set('#ff0000') 
        targetPos.current.set(position.x * 6, position.y * 4, 0)
      } 
      // --- 2. PINCH: ROTATE & CLICK ---
      else if (activeGesture === 'PINCH') {
        targetDistort.current = 0.0
        targetColor.current.set('#ffff00')
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, position.x * Math.PI, 0.1)
        
        if (pinchStartRef.current === null) {
          pinchStartRef.current = Date.now()
          wasPortfolioOpenRef.current = useStore.getState().portfolioOpen
        }
      } 
      // --- 3. PEACE: FIREFLIES ---
      else if (activeGesture === 'PEACE') {
        targetDistort.current = 0.5
        targetColor.current.set('#0000ff')
        targetPos.current.set(0, 0, 0)
      }
      // --- 4. IDLE ---
      else {
        targetDistort.current = 0.2
        targetColor.current.set('#00ff44')
        targetPos.current.set(0, 0, 0)
      }
      
      // Click Detection (on pinch release)
      if (activeGesture !== 'PINCH' && pinchStartRef.current !== null) {
        const diff = Date.now() - pinchStartRef.current
        if (diff < 300 && !wasPortfolioOpenRef.current) {
          raycaster.setFromCamera(new THREE.Vector2(position.x, position.y), state.camera)
          const intersects = raycaster.intersectObject(groupRef.current, true)
          
          if (intersects.length > 0) {
            console.log("CLICK DETECTED (3D) - HIT:", intersects[0].object.name || intersects[0].object.type)
            useStore.getState().setPortfolioOpen(true)
          } else {
            console.log("CLICK DETECTED (3D) - MISSED (no object hit)")
          }
        }
        pinchStartRef.current = null
      }
      
    } else {
      pinchStartRef.current = null
      // MOUSE FALLBACK / FACE TRACKING
      const { pointer } = state
      targetPos.current.set(0, 0, 0)
      
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, pointer.y * 0.3, 0.1)
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, pointer.x * 0.3, 0.1)
    }
    
    // LERP scale and position
    const targetScale = handPresent ? zoomLevel : 1.0
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
    groupRef.current.position.lerp(targetPos.current, 0.08)
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
          position={[0, -2, 0]} 
        />
      )}
      
      <Environment preset="night" />
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

      <group ref={groupRef}>
        {/* CAROUSEL: All models rendered, positioned by ModelSlide */}
        <ModelSlide index={0} currentModel={currentModel}>
          <GamingSetupModel gesture={gesture} active={currentModel === 0} />
        </ModelSlide>
        
        <ModelSlide index={1} currentModel={currentModel}>
          <CustomModel gesture={gesture} active={currentModel === 1} />
        </ModelSlide>
        
        <ModelSlide index={2} currentModel={currentModel}>
          <AIModel gesture={gesture} active={currentModel === 2} />
        </ModelSlide>
      </group>
      
      <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
      
      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} radius={0.6} />
        <ChromaticAberration offset={[0.002, 0.002]} />
        <Noise opacity={0.05} blendFunction={BlendFunction.OVERLAY} />
      </EffectComposer>
    </>
  )
}
