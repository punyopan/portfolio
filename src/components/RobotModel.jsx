import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

export default function RobotModel({ gesture, active }) {
  const group = useRef()
  const bodyRef = useRef()
  const eyeColorRef = useRef(new THREE.Color('#00ff00'))
  
  useFrame((state) => {
    if (!group.current) return
    
    // Idle bob animation
    group.current.position.y = Math.sin(state.clock.getElapsedTime()) * 0.1
    
    // Gesture reactions
    if (active && bodyRef.current) {
      let targetColor = '#00ff00' // Default eye color
      
      if (gesture === 'FIST') {
        targetColor = '#ff0000' // Red when dragging
        group.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 10) * 0.05 // Shake
      } else if (gesture === 'PINCH') {
        targetColor = '#ffff00' // Yellow when rotating
        group.current.rotation.z = 0
      } else if (gesture === 'PEACE') {
        targetColor = '#00aaff' // Blue for peace
      } else {
        group.current.rotation.z = 0
      }
      
      eyeColorRef.current.lerp(new THREE.Color(targetColor), 0.1)
    }
  })

  return (
    <group ref={group}>
      {/* Body */}
      <mesh ref={bodyRef} position={[0, 0, 0]}>
        <boxGeometry args={[1, 1.5, 0.5]} />
        <meshStandardMaterial color="#333" roughness={0.2} metalness={0.8} />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color="#555" roughness={0.2} metalness={0.8} />
      </mesh>
      
      {/* Eyes - reactive to gestures */}
      <mesh position={[-0.15, 1.05, 0.35]}>
        <sphereGeometry args={[0.08]} />
        <meshBasicMaterial color={eyeColorRef.current} />
      </mesh>
      <mesh position={[0.15, 1.05, 0.35]}>
        <sphereGeometry args={[0.08]} />
        <meshBasicMaterial color={eyeColorRef.current} />
      </mesh>
      
      {/* Arms */}
      <mesh position={[-0.7, 0.2, 0]}>
        <boxGeometry args={[0.2, 0.8, 0.2]} />
        <meshStandardMaterial color="#444" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[0.7, 0.2, 0]}>
        <boxGeometry args={[0.2, 0.8, 0.2]} />
        <meshStandardMaterial color="#444" roughness={0.3} metalness={0.7} />
      </mesh>
      
      {/* Hover Label */}
      {active && (
        <Html position={[0, 2, 0]} center transform>
          <div className="text-cyber-green font-mono text-xs bg-black/80 p-1 border border-cyber-green whitespace-nowrap">
            UNIT: R-01
          </div>
        </Html>
      )}
    </group>
  )
}
