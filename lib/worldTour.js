// World Tour — rank progress as a journey through boxing cities.
//
// Each rank tier unlocks a city (Ulaanbaatar → … → Las Vegas). The city is
// drawn as a small procedural 3D world (components/tour/TourScene.js): terrain
// from noise, a generated street grid of buildings around the arena, the sun
// where it really is right now in that city (time zone + date + latitude), and
// weather that fits the city's climate for the season. No map or weather API —
// everything is computed here, deterministically, so it is unit-tested.

import { RANK_TIERS } from "@/lib/xp";

/**
 * Stops, one per rank tier (same order as RANK_TIERS).
 * terrain: mountains (0..1 height), ring (distance where they start), flat (0..1 how flat the city is)
 * city:    density 0..1, height [min,max] storeys, core = tall downtown in the middle, water = river/sea
 * climate: weather weights per season { winter, spring, summer, autumn } → { clear, cloud, rain, snow }
 */
export const TOUR_STOPS = Object.freeze([
  {
    id: "ulaanbaatar", name: ["Улаанбаатар", "울란바토르", "Ulaanbaatar"], arena: ["Бөхийн өргөө", "씨름 궁전", "Wrestling Palace"],
    tz: "Asia/Ulaanbaatar", lat: 47.9, lon: 106.9,
    terrain: { mountains: 1, ring: 34, ground: "#6b6a4a" },
    city: { density: 0.55, height: [2, 16], core: 0.4, water: "river", palette: ["#d9d4c7", "#b9b2a3", "#8f877a", "#c7c2b4"] },
    climate: { winter: { clear: 6, cloud: 2, snow: 2 }, spring: { clear: 5, cloud: 3, snow: 1, rain: 1 }, summer: { clear: 4, cloud: 3, rain: 3 }, autumn: { clear: 6, cloud: 2, snow: 1, rain: 1 } },
  },
  {
    id: "seoul", name: ["Сөүл", "서울", "Seoul"], arena: ["Жамсил", "잠실", "Jamsil"],
    tz: "Asia/Seoul", lat: 37.6, lon: 127.0,
    terrain: { mountains: 0.6, ring: 38, ground: "#4f5a3a" },
    city: { density: 0.75, height: [4, 30], core: 0.7, water: "river", palette: ["#e5e7eb", "#9ca3af", "#6b7280", "#cbd5e1"] },
    climate: { winter: { clear: 5, cloud: 3, snow: 2 }, spring: { clear: 5, cloud: 3, rain: 2 }, summer: { clear: 3, cloud: 3, rain: 4 }, autumn: { clear: 6, cloud: 3, rain: 1 } },
  },
  {
    id: "tokyo", name: ["Токио", "도쿄", "Tokyo"], arena: ["Кораку-эн холл", "고라쿠엔 홀", "Korakuen Hall"],
    tz: "Asia/Tokyo", lat: 35.7, lon: 139.7,
    terrain: { mountains: 0.35, ring: 52, ground: "#3f4a36", peak: true },
    city: { density: 0.9, height: [3, 36], core: 0.8, water: "sea", palette: ["#f3f4f6", "#d1d5db", "#9ca3af", "#e2e8f0"] },
    climate: { winter: { clear: 6, cloud: 3, snow: 1 }, spring: { clear: 4, cloud: 4, rain: 2 }, summer: { clear: 3, cloud: 3, rain: 4 }, autumn: { clear: 5, cloud: 3, rain: 2 } },
  },
  {
    id: "bangkok", name: ["Бангкок", "방콕", "Bangkok"], arena: ["Лумпини", "룸피니", "Lumpinee"],
    tz: "Asia/Bangkok", lat: 13.75, lon: 100.5,
    terrain: { mountains: 0, ring: 60, ground: "#3d5a2a" },
    city: { density: 0.7, height: [2, 28], core: 0.6, water: "river", palette: ["#fde68a", "#f5f5f4", "#d6d3d1", "#fecaca"] },
    climate: { winter: { clear: 6, cloud: 3, rain: 1 }, spring: { clear: 4, cloud: 4, rain: 2 }, summer: { clear: 2, cloud: 3, rain: 5 }, autumn: { clear: 3, cloud: 3, rain: 4 } },
  },
  {
    id: "manila", name: ["Манила", "마닐라", "Manila"], arena: ["Арена", "아레나", "The Arena"],
    tz: "Asia/Manila", lat: 14.6, lon: 121.0,
    terrain: { mountains: 0.25, ring: 50, ground: "#365a2c" },
    city: { density: 0.65, height: [2, 24], core: 0.5, water: "sea", palette: ["#e7e5e4", "#fef3c7", "#a8a29e", "#bae6fd"] },
    climate: { winter: { clear: 6, cloud: 3, rain: 1 }, spring: { clear: 6, cloud: 3, rain: 1 }, summer: { clear: 2, cloud: 3, rain: 5 }, autumn: { clear: 3, cloud: 3, rain: 4 } },
  },
  {
    id: "london", name: ["Лондон", "런던", "London"], arena: ["Йорк холл", "요크 홀", "York Hall"],
    tz: "Europe/London", lat: 51.5, lon: -0.1,
    terrain: { mountains: 0, ring: 60, ground: "#3e5a33" },
    city: { density: 0.75, height: [3, 22], core: 0.45, water: "river", palette: ["#c2a387", "#a8a29e", "#e7e5e4", "#9a7b63"] },
    climate: { winter: { clear: 2, cloud: 5, rain: 3 }, spring: { clear: 3, cloud: 4, rain: 3 }, summer: { clear: 4, cloud: 4, rain: 2 }, autumn: { clear: 2, cloud: 4, rain: 4 } },
  },
  {
    id: "newyork", name: ["Нью-Йорк", "뉴욕", "New York"], arena: ["Мэдисон Сквер Гарден", "매디슨 스퀘어 가든", "Madison Square Garden"],
    tz: "America/New_York", lat: 40.75, lon: -73.99,
    terrain: { mountains: 0, ring: 60, ground: "#3b4a35" },
    city: { density: 1, height: [6, 60], core: 1, water: "river", palette: ["#e5e7eb", "#9ca3af", "#78716c", "#cbd5e1"] },
    climate: { winter: { clear: 4, cloud: 3, snow: 3 }, spring: { clear: 4, cloud: 3, rain: 3 }, summer: { clear: 5, cloud: 3, rain: 2 }, autumn: { clear: 5, cloud: 3, rain: 2 } },
  },
  {
    id: "mexicocity", name: ["Мехико", "멕시코시티", "Mexico City"], arena: ["Арена Мехико", "아레나 멕시코", "Arena México"],
    tz: "America/Mexico_City", lat: 19.4, lon: -99.1,
    terrain: { mountains: 0.8, ring: 40, ground: "#6b5a3e", peak: true },
    city: { density: 0.8, height: [2, 26], core: 0.5, water: null, palette: ["#fca5a5", "#fde68a", "#e7e5e4", "#a7f3d0"] },
    climate: { winter: { clear: 7, cloud: 3 }, spring: { clear: 6, cloud: 3, rain: 1 }, summer: { clear: 2, cloud: 3, rain: 5 }, autumn: { clear: 4, cloud: 3, rain: 3 } },
  },
  {
    id: "lasvegas", name: ["Лас Вегас", "라스베이거스", "Las Vegas"], arena: ["T-Mobile арена", "T-모바일 아레나", "T-Mobile Arena"],
    tz: "America/Los_Angeles", lat: 36.1, lon: -115.2,
    terrain: { mountains: 0.7, ring: 44, ground: "#a3814f" },
    city: { density: 0.5, height: [2, 40], core: 0.9, water: null, palette: ["#fde68a", "#f5f5f4", "#fbcfe8", "#bfdbfe"], neon: true },
    climate: { winter: { clear: 8, cloud: 2 }, spring: { clear: 8, cloud: 2 }, summer: { clear: 9, cloud: 1 }, autumn: { clear: 8, cloud: 2 } },
  },
]);

/** Where the fighter is on the tour for an XP total. */
export function tourProgress(xp) {
  const x = Math.max(0, Number(xp) || 0);
  let index = 0;
  RANK_TIERS.forEach((tier, i) => { if (x >= tier.minXP) index = i; });
  index = Math.min(index, TOUR_STOPS.length - 1);
  const next = index + 1 < TOUR_STOPS.length ? index + 1 : null;
  const from = RANK_TIERS[index].minXP;
  const to = next != null ? RANK_TIERS[next].minXP : null;
  return {
    index,
    stop: TOUR_STOPS[index],
    next: next != null ? TOUR_STOPS[next] : null,
    xpToNext: to != null ? to - x : 0,
    pct: to != null ? Math.min(1, (x - from) / (to - from)) : 1,
    unlocked: TOUR_STOPS.map((_, i) => i <= index),
  };
}

/** Local wall-clock time in a time zone: { hour (fractional 0..24), month 1..12, dayOfYear, label "HH:MM" }. */
export function localTime(tz, date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" })
      .formatToParts(date).map((p) => [p.type, p.value]),
  );
  const y = Number(parts.year), m = Number(parts.month), d = Number(parts.day);
  const h = Number(parts.hour) % 24, min = Number(parts.minute);
  const dayOfYear = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86_400_000);
  return { hour: h + min / 60, month: m, day: d, year: y, dayOfYear, label: `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}` };
}

/** Mean solar time at a longitude (hours, 0..24) — what the sun actually follows, unlike the clock. */
export function solarHour(lon, date = new Date()) {
  const utc = date.getUTCHours() + date.getUTCMinutes() / 60;
  return (((utc + lon / 15) % 24) + 24) % 24;
}

const RAD = Math.PI / 180;

/**
 * Sun elevation (degrees above the horizon) from latitude, day of year and
 * local solar hour. Standard declination / hour-angle formula; good to a few
 * degrees, which is plenty for lighting a scene.
 */
export function sunElevation(lat, dayOfYear, hour) {
  const decl = 23.44 * Math.sin((2 * Math.PI * (dayOfYear - 81)) / 365);
  const ha = 15 * (hour - 12);
  const s = Math.sin(lat * RAD) * Math.sin(decl * RAD) + Math.cos(lat * RAD) * Math.cos(decl * RAD) * Math.cos(ha * RAD);
  return Math.asin(Math.max(-1, Math.min(1, s))) / RAD;
}

/** Sun direction in the scene: azimuth from the hour (east in the morning, west in the evening). */
export function sunDirection(elevation, hour) {
  const az = ((hour - 12) / 12) * Math.PI; // -π at midnight … 0 at noon … π
  const el = elevation * RAD;
  return { x: Math.sin(az) * Math.cos(el), y: Math.sin(el), z: -Math.cos(az) * Math.cos(el) };
}

const mix = (a, b, t) => {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (p, s) => (p >> s) & 255;
  const c = (s) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * t);
  return `#${((c(16) << 16) | (c(8) << 8) | c(0)).toString(16).padStart(6, "0")}`;
};
const clamp01 = (x) => Math.max(0, Math.min(1, x));

/**
 * Sky for a sun elevation: phase (night / dawn / day / dusk), sky + horizon
 * colours, sun light strength 0..1 and how much the city's windows glow.
 */
export function skyFor(elevation, hour) {
  const phase = elevation < -6 ? "night" : elevation < 8 ? (hour < 12 ? "dawn" : "dusk") : "day";
  const day = clamp01((elevation + 6) / 30);            // 0 at civil dusk → 1 by ~24° up
  const golden = clamp01(1 - Math.abs(elevation - 2) / 10) * (elevation > -6 ? 1 : 0);
  const sky = mix(mix("#0b1026", "#3b82c4", day), "#f08a4b", golden * 0.55);
  const horizon = mix(mix("#151a33", "#a9d2f0", day), "#ffb36b", golden * 0.8);
  return {
    phase,
    sky,
    horizon,
    sunLight: clamp01(elevation / 25),
    ambient: 0.18 + 0.55 * day,
    windows: clamp01(1 - day * 1.6),                   // lights come on as the sun goes
  };
}

export function seasonOf(month, lat = 45) {
  const north = lat >= 0;
  const m = north ? month : ((month + 5) % 12) + 1;
  return m === 12 || m <= 2 ? "winter" : m <= 5 ? "spring" : m <= 8 ? "summer" : "autumn";
}

/** Seeded PRNG (mulberry32). */
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

/** Today's weather in a city: picked from its climate for the season, same all day. */
export function weatherFor(stop, lt) {
  const season = seasonOf(lt.month, stop.lat);
  const weights = stop.climate[season];
  const total = Object.values(weights).reduce((s, w) => s + w, 0);
  let r = rng(hash(`${stop.id}:${lt.year}-${lt.month}-${lt.day}`))() * total;
  for (const [kind, w] of Object.entries(weights)) { r -= w; if (r < 0) return { kind, season }; }
  return { kind: "clear", season };
}

// ── Procedural terrain + city (same seed → same city) ─────────────────────

function valueNoise(seed) {
  const cache = new Map();
  const corner = (ix, iz) => {
    const k = `${ix},${iz}`;
    if (!cache.has(k)) cache.set(k, rng(hash(`${seed}:${k}`))());
    return cache.get(k);
  };
  const smooth = (t) => t * t * (3 - 2 * t);
  return (x, z) => {
    const ix = Math.floor(x), iz = Math.floor(z), fx = smooth(x - ix), fz = smooth(z - iz);
    const a = corner(ix, iz), b = corner(ix + 1, iz), c = corner(ix, iz + 1), d = corner(ix + 1, iz + 1);
    return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
  };
}

/** Terrain height function for a stop: flat city in the middle, mountains rising beyond `ring`. */
export function terrainFor(stop) {
  const n = valueNoise(stop.id);
  const { mountains, ring, peak } = stop.terrain;
  return (x, z) => {
    const r = Math.hypot(x, z);
    const rise = clamp01((r - ring) / 30);
    let h = 0;
    for (let o = 0, f = 1 / 18, a = 1; o < 4; o++, f *= 2, a *= 0.5) h += a * n(x * f, z * f);
    h = (h / 1.875) * 22 * mountains * rise * rise;
    // A lone volcano on the skyline (Fuji / Popocatépetl).
    if (peak) {
      const d = Math.hypot(x - 70, z + 70);
      h += Math.max(0, 34 - d * 0.9) * mountains;
    }
    return h + (n(x * 0.3, z * 0.3) - 0.5) * 0.15;
  };
}

/**
 * Buildings on a street grid around the arena (which sits at the origin).
 * Returns [{ x, z, w, d, h, color }] in metres-ish scene units. Taller towards the
 * centre when the city has a downtown core; a river or coast cuts through.
 */
export function cityLayout(stop, { radius = 30, block = 3.2 } = {}) {
  const rand = rng(hash(`city:${stop.id}`));
  const { density, height, core, water, palette } = stop.city;
  const out = [];
  for (let gx = -radius; gx <= radius; gx += block) {
    for (let gz = -radius; gz <= radius; gz += block) {
      const r = Math.hypot(gx, gz);
      if (r < 6.5 || r > radius) continue;                          // arena plaza / city edge
      if (Math.abs(gx) % (block * 4) < 0.01 || Math.abs(gz) % (block * 4) < 0.01) continue; // avenues
      if (water && isWater(stop, gx, gz)) continue;
      const edge = 1 - r / radius;
      if (rand() > density * (0.45 + 0.55 * edge)) continue;
      const tall = core * Math.pow(edge, 1.6);
      const storeys = height[0] + (height[1] - height[0]) * Math.min(1, rand() * (0.35 + tall));
      out.push({
        x: gx + (rand() - 0.5) * 0.4,
        z: gz + (rand() - 0.5) * 0.4,
        w: block * (0.55 + rand() * 0.3),
        d: block * (0.55 + rand() * 0.3),
        h: Math.max(0.6, storeys * 0.35),
        color: palette[Math.floor(rand() * palette.length)],
      });
    }
  }
  return out;
}

/** River (a band across the city) or sea (one side of it). */
export function isWater(stop, x, z) {
  if (stop.city.water === "river") return Math.abs(z - 14 - Math.sin(x / 9) * 3) < 2.4;
  if (stop.city.water === "sea") return x + z * 0.4 > 22;
  return false;
}
