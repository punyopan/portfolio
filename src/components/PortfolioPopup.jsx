import { useStore } from '../store'

export default function PortfolioPopup() {
  const { portfolioOpen, setPortfolioOpen } = useStore()

  if (!portfolioOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-cyber-dark border border-cyber-cyan/50 rounded-lg shadow-[0_0_50px_rgba(0,243,255,0.2)] p-8">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-cyber-cyan/30 pb-4">
          <h2 className="text-4xl font-display text-cyber-cyan tracking-wider drop-shadow-glow">Target Acquired: PORTFOLIO</h2>
          <button 
            onClick={() => setPortfolioOpen(false)}
            className="text-cyber-cyan hover:text-white transition-colors text-2xl font-bold"
          >
            [X]
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div className="bg-black/40 p-6 rounded border border-white/10 hover:border-cyber-cyan/50 transition-colors group">
                    <h3 className="text-2xl text-white mb-2 group-hover:text-cyber-cyan transition-colors">Project Alpha</h3>
                    <p className="text-gray-400">Advanced cyber-security interface with 3D visualization.</p>
                </div>
                <div className="bg-black/40 p-6 rounded border border-white/10 hover:border-cyber-cyan/50 transition-colors group">
                    <h3 className="text-2xl text-white mb-2 group-hover:text-cyber-cyan transition-colors">Neon Drifter</h3>
                    <p className="text-gray-400">WebGpu powered racing experience.</p>
                </div>
                <div className="bg-black/40 p-6 rounded border border-white/10 hover:border-cyber-cyan/50 transition-colors group">
                    <h3 className="text-2xl text-white mb-2 group-hover:text-cyber-cyan transition-colors">Neural Net</h3>
                    <p className="text-gray-400">AI aggregation platform.</p>
                </div>
            </div>
            
            <div className="space-y-4 text-gray-300 font-mono text-sm">
                <p>{`> Initializing connection...`}</p>
                <p>{`> Hand handshake verified.`}</p>
                <p>{`> Downloading assets... [100%]`}</p>
                <p>{`> Access granted.`}</p>
                <br/>
                <p className="text-cyber-cyan">Use 'PINCH' gesture to interact.</p>
            </div>
        </div>

      </div>
    </div>
  )
}
