import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'

const MODEL_PATH = '/models/gaming-setup.glb'

export default function GamingSetupModel({ gesture, active }) {
  const groupRef = useRef()
  
  let scene = null
  try {
    const gltf = useGLTF(MODEL_PATH)
    scene = gltf.scene
  } catch (e) {
    console.warn(`Model not found: ${MODEL_PATH}`)
  }
  
  useFrame((state, delta) => {
    if (!groupRef.current) return
    
    // Idle floating animation
    groupRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.05
    
    // Gesture reactions
    if (active) {
      if (gesture === 'FIST') {
        groupRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 10) * 0.02
      } else if (gesture === 'PINCH') {
        groupRef.current.rotation.y += delta * 0.3
      } else {
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.1)
      }
    }
  })

  return (
    <group ref={groupRef}>
      {scene ? (
        <primitive 
          object={scene} 
          scale={0.002}           // Reduced - adjust if still too big
          position={[0, -1, 0]} // Adjust position
          rotation={[0, 0, 0]}
        />
      ) : (
        <mesh>
          <boxGeometry args={[2, 1, 1]} />
          <meshStandardMaterial color="#00ff00" wireframe />
        </mesh>
      )}
      
      {active && (
        <Html position={[0, 2, 0]} center transform>
          <div className="text-cyber-cyan font-mono text-xs bg-black/80 p-1 border border-cyber-cyan whitespace-nowrap">
            GAMING SETUP
          </div>
        </Html>
      )}
    </group>
  )
}
