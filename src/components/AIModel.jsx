import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles, Html } from '@react-three/drei'
import * as THREE from 'three'

export default function AIModel({ gesture, active }) {
  const hologramsRef = useRef()
  const coreRef = useRef()
  const glowColorRef = useRef(new THREE.Color('#00aaff'))

  useFrame((state, delta) => {
    // Hologram rotation
    if (hologramsRef.current) {
      hologramsRef.current.rotation.y += delta * 0.5
    }
    
    // Gesture reactions
    if (active && coreRef.current) {
      let targetColor = '#00aaff' // Default
      let pulseSpeed = 1
      
      if (gesture === 'FIST') {
        targetColor = '#ff0000'
        pulseSpeed = 3
      } else if (gesture === 'PINCH') {
        targetColor = '#ffff00'
        pulseSpeed = 2
      } else if (gesture === 'PEACE') {
        targetColor = '#ff00ff' // Magenta for peace
        pulseSpeed = 0.5
      }
      
      glowColorRef.current.lerp(new THREE.Color(targetColor), 0.1)
      
      // Pulse scale
      const pulse = 1 + Math.sin(state.clock.getElapsedTime() * pulseSpeed) * 0.1
      coreRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <group>
      {/* Microchip Base */}
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[2, 0.2, 2]} />
        <meshStandardMaterial color="#111" roughness={0.4} metalness={0.9} />
      </mesh>
      
      {/* Circuit Traces */}
      <mesh position={[0, -0.39, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[1.8, 1.8]} />
        <meshBasicMaterial color={glowColorRef.current} wireframe />
      </mesh>

      {/* Hologram Projection */}
      <group position={[0, 1, 0]} ref={hologramsRef}>
        {/* Core Brain */}
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[0.8, 1]} />
          <meshBasicMaterial color={glowColorRef.current} wireframe transparent opacity={0.5} />
        </mesh>
        
        <Sparkles count={50} scale={2} size={2} speed={1} opacity={0.5} color={glowColorRef.current} />
      </group>
      
      {/* Energy Cone */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.8, 0.1, 1, 4, 1, true]} />
        <meshBasicMaterial color={glowColorRef.current} transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>

      {active && (
        <Html position={[0, 2.5, 0]} center transform>
          <div className="text-cyber-blue font-mono text-xs bg-black/80 p-1 border border-cyber-blue whitespace-nowrap">
            MODULE: AI-CORE
          </div>
        </Html>
      )}
    </group>
  )
}
