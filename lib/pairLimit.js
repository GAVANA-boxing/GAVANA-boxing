// "At most N of this kind from A to B per window" — in memory, per server instance. Stops one
// account from repeating the same push to the same person (the per-sender limit alone allows
// 20 a minute). Pure apart from the Map you give it, so it is testable.
export function allowPair(map, key, { max = 3, windowMs = 3_600_000, now = Date.now() } = {}) {
  const e = map.get(key);
  if (!e || now > e.reset) { map.set(key, { count: 1, reset: now + windowMs }); trim(map, now); return true; }
  e.count += 1;
  return e.count <= max;
}

function trim(map, now) {
  if (map.size < 5000) return;
  for (const [k, v] of map) if (now > v.reset) map.delete(k);
}
