import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'

/**
 * TEMPLATE: Custom 3D Model Component
 * 
 * HOW TO USE:
 * 1. Place your .glb or .gltf file in: public/models/
 * 2. Update MODEL_PATH below to match your filename
 * 3. Adjust scale, position, and rotation as needed
 * 4. Import this component in Experience.jsx
 * 
 * EXAMPLE:
 *   import CustomModel from './CustomModel'
 *   <ModelSlide index={1} currentModel={currentModel}>
 *       <CustomModel gesture={gesture} active={currentModel === 1} />
 *   </ModelSlide>
 */

// ⬇️ CHANGE THIS TO YOUR MODEL PATH
const MODEL_PATH = '/models/robot_playground (1)/scene.gltf'

export default function CustomModel({ gesture, active }) {
  const groupRef = useRef()
  
  // Load the GLTF model
  // This will error if file doesn't exist - that's expected until you add your model
  let scene = null
  try {
    const gltf = useGLTF(MODEL_PATH)
    scene = gltf.scene
  } catch (e) {
    // Model not found - will show placeholder
    console.warn(`Model not found: ${MODEL_PATH}`)
  }
  
  // Animation loop
  useFrame((state, delta) => {
    if (!groupRef.current) return
    
    // Idle floating animation
    groupRef.current.position.y = Math.sin(state.clock.getElapsedTime()) * 0.1
    
    // Gesture reactions (optional)
    if (active) {
      if (gesture === 'FIST') {
        // Shake effect
        groupRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 10) * 0.05
      } else if (gesture === 'PINCH') {
        // Spin slowly
        groupRef.current.rotation.y += delta * 0.5
      } else {
        // Reset rotation smoothly
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.1)
      }
    }
  })

  return (
    <group ref={groupRef}>
      {scene ? (
        // Your 3D Model
        <primitive 
          object={scene} 
          scale={1}           // ⬅️ Adjust scale
          position={[0, 0, 0]} // ⬅️ Adjust position
          rotation={[0, 0, 0]} // ⬅️ Adjust rotation [x, y, z] in radians
        />
      ) : (
        // Placeholder shown when model is not loaded
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#ff00ff" wireframe />
        </mesh>
      )}
      
      {/* Label (optional - remove if not needed) */}
      {active && (
        <Html position={[0, 2, 0]} center transform>
          <div className="text-white font-mono text-xs bg-black/80 p-1 border border-white/50 whitespace-nowrap">
            CUSTOM MODEL
          </div>
        </Html>
      )}
    </group>
  )
}

// Preload the model for better performance
// Comment this out if model doesn't exist yet
// useGLTF.preload(MODEL_PATH)
