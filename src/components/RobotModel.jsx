import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'

export default function RobotModel({ active }) {
  const group = useRef()
  
  useFrame((state) => {
    if (group.current) {
        // Idle animation
        group.current.position.y = Math.sin(state.clock.getElapsedTime()) * 0.1
    }
  })

  return (
    <group ref={group} visible={active}>
      {/* Body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1.5, 0.5]} />
        <meshStandardMaterial color="#333" roughness={0.2} metalness={0.8} />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color="#555" roughness={0.2} metalness={0.8} />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[-0.15, 1.05, 0.35]}>
        <sphereGeometry args={[0.05]} />
        <meshBasicMaterial color="#00ff00" />
      </mesh>
       <mesh position={[0.15, 1.05, 0.35]}>
        <sphereGeometry args={[0.05]} />
        <meshBasicMaterial color="#00ff00" />
      </mesh>
      
      {/* Hover Label */}
      {active && (
          <Html position={[0, 2, 0]} center transform>
            <div className="text-cyber-green font-mono text-xs bg-black/80 p-1 border border-cyber-green">
                UNIT: R-01
            </div>
          </Html>
      )}
    </group>
  )
}
