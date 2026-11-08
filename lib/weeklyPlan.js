"use client";

// The AI weekly plan, kept on this device only. (It used to be saved to training_programs,
// which every signed-in user can read — so one fighter's AI plan showed up in everyone's
// program list. users/{uid} is public too, so the device is the private place for now.)
const KEY = "gavana_weekly_plan";

export function loadWeeklyPlan() {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || "null");
    return p && Array.isArray(p.plan?.days) ? p : null;
  } catch { return null; }
}

export function saveWeeklyPlan(entry) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...entry, savedAt: Date.now() })); return true; } catch { return false; }
}

export function clearWeeklyPlan() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
