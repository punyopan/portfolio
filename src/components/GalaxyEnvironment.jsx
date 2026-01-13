import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars, Sparkles, Float } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../store'

export default function GalaxyEnvironment() {
  const gridRef = useRef()
  const lowPerfActive = useStore((s) => s.lowPerfActive)
  
  useFrame((state, delta) => {
    if (gridRef.current) {
      gridRef.current.rotation.x += delta * 0.02
      gridRef.current.rotation.y += delta * 0.03
    }
  })

  // Performance-adjusted counts
  const starCount = lowPerfActive ? 1000 : 5000
  const sparkleCount1 = lowPerfActive ? 50 : 300
  const sparkleCount2 = lowPerfActive ? 0 : 100 // Disabled in low-perf

  return (
    <group>
      {/* Deep Space Background - Dynamic Stars */}
      <Stars radius={300} depth={50} count={starCount} factor={4} saturation={0} fade speed={1} />
      
      {/* Data Dust / Sparkles */}
      <Sparkles count={sparkleCount1} scale={20} size={2} speed={0.4} opacity={0.4} color="#00f3ff" />
      {sparkleCount2 > 0 && (
        <Sparkles count={sparkleCount2} scale={15} size={4} speed={0.3} opacity={0.2} color="#ff00ff" />
      )}
      
      {/* Metric Grid Structure - Only render in high-perf mode */}
      {!lowPerfActive && (
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2}>
          <mesh ref={gridRef} scale={20}>
            <icosahedronGeometry args={[1, 2]} />
            <meshBasicMaterial 
              color="#00f3ff" 
              wireframe 
              transparent 
              opacity={0.03} 
              side={THREE.BackSide}
            />
          </mesh>
        </Float>
      )}
      
      {/* Cyber Background Color (Darker for contrast) */}
      <color attach="background" args={['#020205']} />
    </group>
  )
}
