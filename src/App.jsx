import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import Experience from './components/Experience'
import HUD from './components/HUD'
import HandManager from './components/HandManager'
import HandCursor from './components/HandCursor'
import PortfolioPopup from './components/PortfolioPopup'
import CameraError from './components/CameraError'
import { useStore } from './store'

function App() {
  const systemStatus = useStore((state) => state.systemStatus)
  
  return (
    <div className="w-screen h-screen bg-cyber-bg relative overflow-hidden">
      {/* Error Fallback */}
      {systemStatus === 'ERROR' && <CameraError />}
      
      <PortfolioPopup />
      <HUD />
      <HandManager />
      <HandCursor />
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        className="w-full h-full block"
        gl={{ 
            powerPreference: "high-performance",
            antialias: false,
            stencil: false,
            depth: true 
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <Experience />
        </Suspense>
      </Canvas>
      
      {/* Grain/scanline overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
    </div>
  )
}

export default App

