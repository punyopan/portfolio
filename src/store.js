import { create } from 'zustand'

export const useStore = create((set) => ({
  handPresent: false,
  // Normalized coordinates (-1 to 1)
  position: { x: 0, y: 0, z: 0 },
  zoomLevel: 1.0, // Default zoom level
  rotation: { x: 0, y: 0, z: 0 }, 
  gesture: 'NONE', // 'FIST', 'OPEN_PALM', 'POINTING', 'NONE'
  
  debugMode: false,
  toggleDebug: () => set((state) => ({ debugMode: !state.debugMode })),
  
  portfolioOpen: false,
  setPortfolioOpen: (isOpen) => set({ portfolioOpen: isOpen }),
  
  currentModel: 0,
  nextModel: () => set((state) => ({ currentModel: (state.currentModel + 1) % 3 })),
  prevModel: () => set((state) => ({ currentModel: (state.currentModel - 1 + 3) % 3 })),
  
  systemStatus: 'INITIALIZING', // 'INITIALIZING', 'READY', 'ERROR'
  errorMessage: null,
  setSystemStatus: (status, msg = null) => set({ systemStatus: status, errorMessage: msg }),

  // Performance settings
  performanceMode: 'auto', // 'auto' | 'high' | 'low'
  lowPerfActive: false,    // Actual current performance state
  currentFps: 60,          // Current FPS for display
  setPerformanceMode: (mode) => set({ performanceMode: mode }),
  setLowPerfActive: (active) => set({ lowPerfActive: active }),
  setCurrentFps: (fps) => set({ currentFps: fps }),

  // Update all state at once to minimize re-renders if needed
  updateHand: (data) => set((state) => ({ ...state, ...data })),
  
  setHandPresent: (present) => set({ handPresent: present }),
}))
