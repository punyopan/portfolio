import { useStore } from '../store'

export default function NavigationButtons() {
  const { nextModel, prevModel, currentModel } = useStore()
  
  return (
    <>
      {/* Left Arrow - Previous Model */}
      <button 
        onClick={prevModel}
        className="fixed left-4 top-1/2 -translate-y-1/2 z-50 
                   w-12 h-12 rounded-full 
                   bg-black/50 hover:bg-black/80 
                   border border-cyber-cyan/50 hover:border-cyber-cyan 
                   text-cyber-cyan text-2xl
                   transition-all duration-300 
                   hover:scale-110 active:scale-95
                   backdrop-blur-sm
                   flex items-center justify-center"
        aria-label="Previous model"
      >
        ‹
      </button>
      
      {/* Right Arrow - Next Model */}
      <button 
        onClick={nextModel}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-50 
                   w-12 h-12 rounded-full 
                   bg-black/50 hover:bg-black/80 
                   border border-cyber-cyan/50 hover:border-cyber-cyan 
                   text-cyber-cyan text-2xl
                   transition-all duration-300 
                   hover:scale-110 active:scale-95
                   backdrop-blur-sm
                   flex items-center justify-center"
        aria-label="Next model"
      >
        ›
      </button>
      
      {/* Dot Indicators */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-3">
        {[0, 1, 2].map((index) => (
          <button
            key={index}
            onClick={() => useStore.setState({ currentModel: index })}
            className={`w-3 h-3 rounded-full transition-all duration-300 
                       ${currentModel === index 
                         ? 'bg-cyber-cyan scale-125' 
                         : 'bg-white/30 hover:bg-white/50'}`}
            aria-label={`Go to model ${index + 1}`}
          />
        ))}
      </div>
    </>
  )
}
