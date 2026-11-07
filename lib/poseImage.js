"use client";

// MediaPipe PoseLandmarker in IMAGE mode, for one-photo checks (stance photo
// in onboarding). Same local bundle / wasm as hooks/usePoseDetection.js; loaded
// only when the user picks a photo. Everything runs on the device.

const LOCAL_BUNDLE = "/mediapipe/vision_bundle.mjs";
const LOCAL_WASM = "/mediapipe/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

let _imagePromise = null;

export function loadImagePoseLandmarker() {
  if (_imagePromise) return _imagePromise;
  _imagePromise = (async () => {
    // Hidden from the bundler (served from /public), as in usePoseDetection.
    const runtimeImport = new Function("url", "return import(url)");
    const { FilesetResolver, PoseLandmarker } = await runtimeImport(LOCAL_BUNDLE);
    const vision = await FilesetResolver.forVisionTasks(LOCAL_WASM);
    const opts = (delegate) => ({
      baseOptions: { modelAssetPath: MODEL_URL, delegate },
      runningMode: "IMAGE",
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
    });
    try { return await PoseLandmarker.createFromOptions(vision, opts("GPU")); }
    catch { return await PoseLandmarker.createFromOptions(vision, opts("CPU")); }
  })();
  _imagePromise.catch(() => { _imagePromise = null; });
  return _imagePromise;
}

/** Decode a File into an <img> (EXIF orientation applied by the browser). */
export function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, release: () => URL.revokeObjectURL(url) });
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("decode")); };
    img.src = url;
  });
}

/** Pose landmarks for one photo: { world, image } or null when no person. */
export async function detectPoseInPhoto(file) {
  const [landmarker, { img, release }] = await Promise.all([loadImagePoseLandmarker(), fileToImage(file)]);
  try {
    const res = landmarker.detect(img);
    const image = res?.landmarks?.[0];
    if (!image) return null;
    return { world: res.worldLandmarks?.[0] || image, image };
  } finally {
    release();
  }
}
