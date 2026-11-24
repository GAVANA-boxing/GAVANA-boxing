// Merge two academy lessonProgress maps (guest localStorage + account profile).
// Keeps the best of each field so nothing the guest earned is lost on sign-up.
export function mergeLessonProgress(a = {}, b = {}) {
  const out = {};
  for (const id of new Set([...Object.keys(a || {}), ...Object.keys(b || {})])) {
    const x = (a && a[id]) || {};
    const y = (b && b[id]) || {};
    out[id] = {
      attempted: !!(x.attempted || y.attempted),
      completed: !!(x.completed || y.completed),
      bestScore: Math.max(x.bestScore || 0, y.bestScore || 0),
      lastTrained: [x.lastTrained, y.lastTrained].filter(Boolean).sort().pop() || null,
    };
  }
  return out;
}
