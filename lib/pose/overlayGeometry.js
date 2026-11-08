// Where a normalized landmark (0..1 of the camera frame) lands on screen when the video is
// shown with `object-fit: cover` in a box of boxW × boxH. Pure; tested.

/** → { scale, offsetX, offsetY } so that px = offsetX + x * videoW * scale. */
export function coverFit(videoW, videoH, boxW, boxH) {
  if (!(videoW > 0 && videoH > 0 && boxW > 0 && boxH > 0)) return null;
  const scale = Math.max(boxW / videoW, boxH / videoH);
  return { scale, offsetX: (boxW - videoW * scale) / 2, offsetY: (boxH - videoH * scale) / 2 };
}

export function toBox(lm, videoW, videoH, fit) {
  return { x: fit.offsetX + lm.x * videoW * fit.scale, y: fit.offsetY + lm.y * videoH * fit.scale };
}

// MediaPipe BlazePose indices: arms, shoulders, torso, legs (no face mesh — less to draw).
export const SKELETON_EDGES = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28],
];
