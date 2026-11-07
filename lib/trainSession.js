// Training Studio state machine.
//
// The Train screen used to decide what to show from a pile of separate flags
// (camera state, round phase, saving / saved / error text). That allowed
// screens that make no sense — e.g. a "REC" label while the camera was denied.
// This module names every state the studio can be in, says which moves between
// them are legal, and says what each state shows. It is pure: the page feeds it
// the flags it already has and renders from the answer.
//
//   requestingCamera ─┬─> ready ─────────────┐
//                     ├─> cameraDenied ──────┤  (start works without a camera:
//                     └─> cameraUnavailable ─┤   timer-only round)
//                                            v
//                                        countdown ──> recording ──> result
//                                            ^                         │
//          (again)  ┌────────────────────────┴──── saved <── saving <──┘
//                   └──────────────────────────── saveFailed <─┘ (retry → saving)

export const STUDIO = Object.freeze({
  REQUESTING_CAMERA: "requestingCamera",
  CAMERA_DENIED: "cameraDenied",
  CAMERA_UNAVAILABLE: "cameraUnavailable",
  READY: "ready",
  COUNTDOWN: "countdown",
  RECORDING: "recording",
  RESULT: "result",
  SAVING: "saving",
  SAVED: "saved",
  SAVE_FAILED: "saveFailed",
});

const S = STUDIO;

/** Waiting to start: the camera may or may not be usable. */
export const IDLE_STATES = Object.freeze([S.REQUESTING_CAMERA, S.CAMERA_DENIED, S.CAMERA_UNAVAILABLE, S.READY]);
/** A round has finished and its result is on screen. */
export const RESULT_STATES = Object.freeze([S.RESULT, S.SAVING, S.SAVED, S.SAVE_FAILED]);

// getUserMedia error names that mean "the user (or a policy) said no" — the fix
// is a permission setting. Everything else (no device, device busy, …) is a
// hardware problem and needs a different message.
const PERMISSION_ERRORS = new Set(["NotAllowedError", "SecurityError", "PermissionDeniedError"]);

export function cameraStudioState(cameraState, cameraError) {
  if (cameraState === "ready") return S.READY;
  if (cameraState === "checking" || !cameraState) return S.REQUESTING_CAMERA;
  if (cameraState === "denied") {
    // No error name recorded → treat as a permission problem (the old behaviour).
    return !cameraError || PERMISSION_ERRORS.has(cameraError) ? S.CAMERA_DENIED : S.CAMERA_UNAVAILABLE;
  }
  return S.CAMERA_UNAVAILABLE; // "unsupported" or anything unknown
}

/**
 * @param {object} f
 * @param {string} f.cameraState  "checking" | "ready" | "denied" | "unsupported"
 * @param {string} [f.cameraError] getUserMedia error name, e.g. "NotAllowedError"
 * @param {string} f.phase        "idle" | "countdown" | "recording" | "result"
 * @param {boolean} [f.saving]
 * @param {boolean} [f.saved]
 * @param {boolean} [f.saveFailed]
 * @returns {{ state: string, camera: string, cameraLive: boolean }}
 *   state  — the studio state; camera — the camera's own idle state (what the
 *   stage shows when there is no live preview, even mid-round).
 */
export function deriveStudio({ cameraState, cameraError, phase, saving, saved, saveFailed } = {}) {
  const cameraLive = cameraState === "ready";
  const camera = cameraStudioState(cameraState, cameraError);
  let state;
  if (phase === "countdown") state = S.COUNTDOWN;
  else if (phase === "recording") state = S.RECORDING;
  else if (phase === "result") {
    state = saving ? S.SAVING : saved ? S.SAVED : saveFailed ? S.SAVE_FAILED : S.RESULT;
  } else state = camera;
  return { state, camera, cameraLive };
}

// Legal moves. Idle states can change into each other at any time (permission
// granted later, camera flipped, retry pressed).
const NEXT = {
  [S.REQUESTING_CAMERA]: [...IDLE_STATES, S.COUNTDOWN],
  [S.CAMERA_DENIED]: [...IDLE_STATES, S.COUNTDOWN],
  [S.CAMERA_UNAVAILABLE]: [...IDLE_STATES, S.COUNTDOWN],
  [S.READY]: [...IDLE_STATES, S.COUNTDOWN],
  [S.COUNTDOWN]: [S.RECORDING, ...IDLE_STATES],
  [S.RECORDING]: [S.RESULT, ...IDLE_STATES],
  [S.RESULT]: [S.SAVING, S.COUNTDOWN, ...IDLE_STATES],
  [S.SAVING]: [S.SAVED, S.SAVE_FAILED, S.RESULT],
  [S.SAVED]: [S.COUNTDOWN, ...IDLE_STATES],
  [S.SAVE_FAILED]: [S.SAVING, S.COUNTDOWN, ...IDLE_STATES],
};

export function canTransition(from, to) {
  if (!from || from === to) return true;
  return (NEXT[from] || []).includes(to);
}

/**
 * What the studio shows in each state.
 * - recBadge: the red recording indicator — only while a round runs on a live camera.
 * - dock: the sticky Start button (and the stance picker above it).
 * - startKind: "start" (camera ready / still asking), "timer" (no camera — a
 *   timer-only round), "again" (after a result).
 * - stageMessage: the fallback block over the stage when there is no camera
 *   ("checking" | "denied" | "unavailable" | null) — follows the camera, so a
 *   timer-only round keeps saying why there is no preview.
 * - retryCamera: offer the "retry camera" button (only between rounds).
 */
export function studioUi({ state, camera, cameraLive }) {
  const idle = IDLE_STATES.includes(state);
  const afterRound = RESULT_STATES.includes(state);
  const noCamera = state === S.CAMERA_DENIED || state === S.CAMERA_UNAVAILABLE;
  return {
    recBadge: state === S.RECORDING && !!cameraLive,
    dock: (idle || afterRound) && state !== S.SAVING,
    startKind: afterRound ? "again" : noCamera ? "timer" : "start",
    stageMessage: cameraLive ? null
      : camera === S.CAMERA_DENIED ? "denied"
      : camera === S.CAMERA_UNAVAILABLE ? "unavailable"
      : "checking",
    retryCamera: !cameraLive && (camera === S.CAMERA_DENIED || camera === S.CAMERA_UNAVAILABLE) && (idle || afterRound),
  };
}
