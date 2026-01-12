import { RoundedBox } from '@react-three/drei'
import { forwardRef } from 'react'
import * as THREE from 'three'

// Forward ref to the group, receive material ref via props
const CyberTerminal = forwardRef(({ refContent, ...props }, ref) => {
  return (
    <group ref={ref} {...props}>
      {/* Monitor Frame */}
      <RoundedBox args={[3.2, 2.2, 0.2]} radius={0.1} smoothness={4}>
        <meshStandardMaterial 
            color="#1a1a2e" 
            metalness={0.8} 
            roughness={0.2} 
            envMapIntensity={1}
        />
      </RoundedBox>
      
      {/* Screen (The sentient part) */}
      <mesh position={[0, 0, 0.11]}>
        <planeGeometry args={[3, 2]} />
        <hyperShapeMaterial 
            ref={refContent} 
            side={THREE.FrontSide}
            transparent={true} // Allow glow to interact
        />
      </mesh>
      
      {/* Base / Stand */}
      <group position={[0, -1.5, 0]} rotation={[0.2, 0, 0]}>
         <RoundedBox args={[3.2, 0.2, 1.5]} radius={0.05} smoothness={4}>
             <meshStandardMaterial color="#111" metalness={0.9} roughness={0.5} />
         </RoundedBox>
         {/* Keys glow */}
         <mesh position={[0, 0.11, 0.2]} rotation={[-Math.PI/2, 0, 0]}>
             <planeGeometry args={[2.8, 1]} />
             <meshBasicMaterial color="#00f3ff" opacity={0.1} transparent side={THREE.DoubleSide} />
         </mesh>
      </group>
    </group>
  )
})

export default CyberTerminal
