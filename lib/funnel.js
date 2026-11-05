"use client";
// Client funnel tracker. Wraps lib/analytics `track` with the identity and
// timing a funnel needs:
//   anonId — stable per-browser id, so a visitor is counted once per step even
//            before they sign up (and joins up with their uid after).
//   uid    — Firebase uid when signed in.
//   first  — true the first time this browser ever reaches this step, so the
//            dashboard can show the NEW-user funnel separately from repeats.
//   ms     — milliseconds since Train was opened (time-to-wow on result_viewed).
// Never throws, never blocks the UI.

import { track } from "@/lib/analytics";

export const FUNNEL = {
  APP_OPENED: "app_opened",
  LANDING_VIEWED: "landing_viewed",
  AUTH_COMPLETED: "auth_completed",
  ONBOARDING_COMPLETED: "onboarding_completed",
  TRAIN_OPENED: "train_opened",
  CAMERA_GRANTED: "camera_granted",
  CAMERA_DENIED: "camera_denied",
  POSE_DETECTED: "pose_detected",
  SESSION_STARTED: "session_started",
  FIRST_PUNCH: "first_punch",
  RESULT_VIEWED: "result_viewed",
  SESSION_COMPLETED: "session_completed",
};

const ANON_KEY = "gavana_anon_id";
const SEEN_KEY = "gavana_funnel_seen";
const TRAIN_T0_KEY = "gavana_train_t0";
const OPENED_DAY_KEY = "gavana_app_opened_day";

function safeGet(store, key) {
  try { return store.getItem(key); } catch { return null; }
}
function safeSet(store, key, value) {
  try { store.setItem(key, value); } catch { /* private mode etc. */ }
}

export function getAnonId() {
  if (typeof window === "undefined") return "";
  let id = safeGet(localStorage, ANON_KEY);
  if (!id) {
    id = (crypto?.randomUUID?.() || `a_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`);
    safeSet(localStorage, ANON_KEY, id);
  }
  return id;
}

function markFirst(step) {
  let seen = [];
  try { seen = JSON.parse(safeGet(localStorage, SEEN_KEY) || "[]"); } catch { seen = []; }
  if (seen.includes(step)) return false;
  seen.push(step);
  safeSet(localStorage, SEEN_KEY, JSON.stringify(seen));
  return true;
}

async function currentUid() {
  try {
    const { auth } = await import("@/lib/firebase");
    return auth?.currentUser?.uid || "";
  } catch {
    return "";
  }
}

/** Record a funnel step. `props` may carry score / hits / locale / extra context. */
export function funnel(step, props = {}) {
  if (typeof window === "undefined") return;
  try {
    if (step === FUNNEL.TRAIN_OPENED) safeSet(sessionStorage, TRAIN_T0_KEY, String(Date.now()));
    const t0 = Number(safeGet(sessionStorage, TRAIN_T0_KEY)) || 0;
    const ms = t0 ? Date.now() - t0 : 0;
    const anonId = getAnonId();
    const first = markFirst(step);
    currentUid().then((uid) => {
      track(step, { ...props, anonId, uid, first, ms });
    });
  } catch { /* never throw */ }
}

/** Fire app_opened at most once per local day — the basis for D1/D7 retention. */
export function funnelAppOpened() {
  if (typeof window === "undefined") return;
  const d = new Date();
  const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  if (safeGet(localStorage, OPENED_DAY_KEY) === day) return;
  safeSet(localStorage, OPENED_DAY_KEY, day);
  funnel(FUNNEL.APP_OPENED);
}
