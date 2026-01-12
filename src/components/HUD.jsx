import { useStore } from '../store'

export default function HUD() {
  const toggleDebug = useStore((state) => state.toggleDebug)
  const debugMode = useStore((state) => state.debugMode)
  
  // Get real-time gesture data
  const gesture = useStore((state) => state.gesture)
  const handPresent = useStore((state) => state.handPresent)
  
  const systemStatus = useStore((state) => state.systemStatus)
  const errorMessage = useStore((state) => state.errorMessage)

  return (
    <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between z-10">
      {/* Header Stats */}
      <header className="flex justify-between items-start">
        <div className="glass-panel p-4 transform skew-x-[-10deg]">
          <div className="transform skew-x-[10deg]">
             <h1 className="text-4xl font-mono font-bold text-neon-cyan tracking-tighter">
                NEURO<span className="text-white mx-1">-</span>KINETIC
            </h1>
            <div className="flex items-center gap-2 mt-2">
                 <span className={`h-2 w-2 rounded-full animate-pulse ${
                    systemStatus === 'READY' ? (handPresent ? 'bg-green-500' : 'bg-yellow-500') : 
                    systemStatus === 'ERROR' ? 'bg-red-600' : 'bg-blue-500'
                 }`}></span>
                 <p className="text-xs text-cyber-magenta font-mono">
                    {systemStatus === 'INITIALIZING' && 'INITIALIZING SYSTEM...'}
                    {systemStatus === 'READY' && (handPresent ? 'NEURAL LINK ESTABLISHED' : 'SEARCHING FOR INPUT...')}
                    {systemStatus === 'ERROR' && 'SYSTEM FAILURE'}
                 </p>
            </div>
            {systemStatus === 'ERROR' && (
                <div className="mt-2 p-2 bg-red-900/50 border border-red-500 text-[10px] text-red-200 font-mono max-w-[300px]">
                    ERR: {errorMessage}
                </div>
            )}
          </div>
        </div>
        
        <div className="glass-panel p-2 flex gap-4">
             <div className="text-right font-mono text-xs text-gray-400">
                <span className="block text-neon-cyan">CPU :: OPTIMAL</span>
                <span className="block">MEM :: 34%</span>
            </div>
        </div>
      </header>
      
      {/* Footer / Status */}
      <footer className="flex justify-between items-end">
        <div className="glass-panel p-4 max-w-md border-l-4 border-l-cyber-cyan">
            <p className="font-mono text-xs text-gray-300 leading-relaxed">
                <span className="text-cyber-cyan">&gt;&gt;&gt;</span> DETECTED GESTURE: 
                <span className={`ml-2 font-bold ${
                    gesture === 'FIST' ? 'text-red-500 shadow-[0_0_10px_red]' : 
                    gesture === 'OPEN_PALM' ? 'text-green-400 shadow-[0_0_10px_green]' : 'text-gray-500'
                }`}>
                    {gesture || 'NONE'}
                </span>
                <br/>
                <span className="opacity-50">Hand Position: {handPresent ? 'TRACKING' : 'LOST'}</span>
            </p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
             <button 
                onClick={() => toggleDebug()}
                className={`pointer-events-auto px-4 py-2 font-mono text-xs tracking-widest border transition-all duration-300 ${
                    debugMode 
                    ? 'bg-cyber-magenta/20 border-cyber-magenta text-neon-magenta shadow-[0_0_15px_rgba(255,0,255,0.4)]' 
                    : 'bg-black/40 border-gray-600 text-gray-400 hover:border-cyber-cyan hover:text-cyber-cyan'
                }`}
             >
                [ NEURAL DEBUG ]
             </button>
             
             <div className="glass-panel px-6 py-2 rounded-full border-cyber-magenta/50">
                <span className="font-mono text-xs text-neon-magenta tracking-widest">VERSION 1.0.0</span>
             </div>
        </div>
      </footer>
    </div>
  )
}
