import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles, Html } from '@react-three/drei'

export default function AIModel({ active }) {
  const chipRef = useRef()
  const hologramsRef = useRef()

  useFrame((state, delta) => {
    if (hologramsRef.current) {
        hologramsRef.current.rotation.y += delta * 0.5
    }
  })

  return (
    <group visible={active}>
      {/* Microchip Base */}
      <mesh ref={chipRef} position={[0, -0.5, 0]}>
        <boxGeometry args={[2, 0.2, 2]} />
        <meshStandardMaterial color="#111" roughness={0.4} metalness={0.9} />
      </mesh>
      
      {/* Circuit Traces (Visual Only - simplified) */}
      <mesh position={[0, -0.39, 0]} rotation={[-Math.PI/2, 0, 0]}>
         <planeGeometry args={[1.8, 1.8]} />
         <meshBasicMaterial color="#0033ff" wireframe />
      </mesh>

      {/* Hologram Projection */}
      <group position={[0, 1, 0]} ref={hologramsRef}>
         {/* Brain / Network Nodes */}
         <mesh>
            <icosahedronGeometry args={[0.8, 1]} />
            <meshBasicMaterial color="#00aaff" wireframe transparent opacity={0.3} />
         </mesh>
         
         <Sparkles count={50} scale={2} size={2} speed={1} opacity={0.5} color="#00aaff" />
      </group>
      
      {/* Cones connecting chip to hologram */}
       <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.8, 0.1, 1, 4, 1, true]} />
        <meshBasicMaterial color="#00aaff" transparent opacity={0.1} side={2} />
      </mesh>

      {active && (
          <Html position={[0, 2.5, 0]} center transform>
             <div className="text-cyber-blue font-mono text-xs bg-black/80 p-1 border border-cyber-blue">
                MODULE: AI-CORE
            </div>
          </Html>
      )}
    </group>
  )
}
