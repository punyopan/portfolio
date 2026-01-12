import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

let handLandmarker = null;

// Listen for messages from the main thread
self.onmessage = async (event) => {
  const { action, payload } = event.data;

  switch (action) {
    case 'init':
      await initializeLandmarker();
      break;
    case 'detect':
      detect(payload);
      break;
  }
};

async function initializeLandmarker() {
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 1,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    
    self.postMessage({ type: 'ready' });
  } catch (error) {
    self.postMessage({ type: 'error', error: error.message });
  }
}

function detect({ image, timestamp }) {
  if (!handLandmarker) return;

  try {
    const result = handLandmarker.detectForVideo(image, timestamp);
    self.postMessage({ type: 'result', result });
  } catch (e) {
    // console.error(e); 
    // Ignore sporadic frame errors
  }
}
