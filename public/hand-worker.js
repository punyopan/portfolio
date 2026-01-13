/* eslint-disable no-undef */
importScripts('/libs/mediapipe/vision_bundle_shim.js');

let handLandmarker = null;

self.onmessage = async (event) => {
  const { action, payload, lowPerf } = event.data;

  switch (action) {
    case 'init':
        try {
            await initializeLandmarker(lowPerf);
        } catch(e) {
            self.postMessage({ type: 'error', error: e.message });
        }
      break;
    case 'detect':
      detect(payload);
      break;
  }
};

async function initializeLandmarker(lowPerf = false) {
    // Access globals exposed by the bundle
    // Check both self and the shimmed exports
    const VisionModule = self.vision || (self.exports ? self.exports : self);
    const FilesetResolver = self.FilesetResolver || VisionModule.FilesetResolver;
    const HandLandmarker = self.HandLandmarker || VisionModule.HandLandmarker;

    if (!FilesetResolver || !HandLandmarker) {
        throw new Error("Failed to load MediaPipe classes from bundle. Checked self.vision, self.exports, and self keys.");
    }

    const vision = await FilesetResolver.forVisionTasks("/libs/mediapipe/wasm");
    
    // Low-perf mode: use CPU delegate and single hand for better performance
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: lowPerf ? "CPU" : "GPU"
      },
      runningMode: "VIDEO",
      numHands: lowPerf ? 1 : 2,
      minHandDetectionConfidence: lowPerf ? 0.6 : 0.5,
      minHandPresenceConfidence: lowPerf ? 0.5 : 0.4,
      minTrackingConfidence: lowPerf ? 0.5 : 0.4
    });
    
    console.log(`⚡ MediaPipe initialized (${lowPerf ? 'LOW-PERF: CPU, 1 hand' : 'HIGH-PERF: GPU, 2 hands'})`);
    self.postMessage({ type: 'ready' });
}

function detect({ image, timestamp }) {
  if (!handLandmarker) return;

  try {
    const result = handLandmarker.detectForVideo(image, timestamp);
    self.postMessage({ type: 'result', result });
  } catch (e) {
    // Ignore sporadic frame errors
  }
}
