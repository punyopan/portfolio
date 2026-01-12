import { useStore } from '../store'

export default function CameraError() {
  const errorMessage = useStore((state) => state.errorMessage)
  const setSystemStatus = useStore((state) => state.setSystemStatus)
  
  const handleRetry = () => {
    setSystemStatus('INITIALIZING')
    // Trigger page reload to reinitialize camera
    window.location.reload()
  }
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="max-w-md p-6 border border-red-500/50 rounded-lg bg-black/80 text-center">
        {/* Icon */}
        <div className="mb-4 text-6xl text-red-500">
          ⚠️
        </div>
        
        {/* Title */}
        <h2 className="text-xl font-bold text-red-400 mb-2 font-mono">
          CAMERA ERROR
        </h2>
        
        {/* Message */}
        <p className="text-gray-400 mb-4 font-mono text-sm">
          {errorMessage || "Unable to access camera. Please ensure camera permissions are granted."}
        </p>
        
        {/* Common Issues */}
        <div className="text-left mb-6 p-3 bg-gray-900/50 rounded border border-gray-700">
          <p className="text-xs text-gray-500 mb-2">Common fixes:</p>
          <ul className="text-xs text-gray-400 list-disc list-inside space-y-1">
            <li>Allow camera access in browser settings</li>
            <li>Check if camera is used by another app</li>
            <li>Ensure HTTPS connection (or localhost)</li>
            <li>Try a different browser</li>
          </ul>
        </div>
        
        {/* Retry Button */}
        <button 
          onClick={handleRetry}
          className="px-6 py-2 bg-cyber-cyan/20 border border-cyber-cyan text-cyber-cyan font-mono text-sm rounded hover:bg-cyber-cyan/30 transition-colors"
        >
          RETRY
        </button>
        
        {/* Continue Without Camera */}
        <button 
          onClick={() => setSystemStatus('READY')}
          className="block mx-auto mt-3 text-xs text-gray-500 hover:text-gray-400 transition-colors"
        >
          Continue without hand tracking →
        </button>
      </div>
    </div>
  )
}
