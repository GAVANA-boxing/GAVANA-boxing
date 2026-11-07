import { describe, it, expect } from "vitest";
import { RANK_TIERS } from "@/lib/xp";
import { TOUR_STOPS, tourProgress, localTime, solarHour, sunElevation, sunDirection, skyFor, seasonOf, weatherFor, cityLayout, terrainFor, isWater } from "@/lib/worldTour";

describe("tour stops", () => {
  it("one city per rank tier, all fully described", () => {
    expect(TOUR_STOPS).toHaveLength(RANK_TIERS.length);
    expect(TOUR_STOPS[0].id).toBe("ulaanbaatar");
    expect(TOUR_STOPS[TOUR_STOPS.length - 1].id).toBe("lasvegas");
    for (const s of TOUR_STOPS) {
      expect(s.name).toHaveLength(3);
      expect(s.arena).toHaveLength(3);
      expect(() => new Intl.DateTimeFormat("en", { timeZone: s.tz })).not.toThrow();
      for (const season of ["winter", "spring", "summer", "autumn"]) expect(Object.keys(s.climate[season]).length).toBeGreaterThan(0);
    }
  });
});

describe("tourProgress", () => {
  it("starts in Ulaanbaatar and moves with the rank ladder", () => {
    expect(tourProgress(0)).toMatchObject({ index: 0, xpToNext: RANK_TIERS[1].minXP });
    expect(tourProgress(0).next.id).toBe("seoul");
    const mid = tourProgress(RANK_TIERS[2].minXP + 10);
    expect(mid.stop.id).toBe("tokyo");
    expect(mid.unlocked.filter(Boolean)).toHaveLength(3);
    expect(mid.pct).toBeGreaterThan(0);
    expect(mid.pct).toBeLessThan(0.05);
  });
  it("ends in Las Vegas", () => {
    const end = tourProgress(1e9);
    expect(end).toMatchObject({ next: null, pct: 1, xpToNext: 0 });
    expect(end.stop.id).toBe("lasvegas");
    expect(tourProgress(-5).index).toBe(0);
  });
});

describe("time, sun and sky", () => {
  const date = new Date("2026-11-06T03:00:00Z"); // 11:00 in Ulaanbaatar, 12:00 in Seoul, 22:00 in New York (prev day)

  it("reads local time in each city's zone", () => {
    expect(localTime("Asia/Ulaanbaatar", date)).toMatchObject({ hour: 11, label: "11:00", month: 11 });
    expect(localTime("Asia/Seoul", date).label).toBe("12:00");
    expect(localTime("America/New_York", date)).toMatchObject({ label: "22:00", day: 5 });
    expect(localTime("Asia/Seoul", date).dayOfYear).toBe(310);
  });

  it("solar time follows longitude, not the time zone", () => {
    expect(solarHour(0, new Date("2026-11-06T12:00:00Z"))).toBeCloseTo(12);
    expect(solarHour(106.9, date)).toBeCloseTo(3 + 106.9 / 15, 3); // UB: clock 11:00, sun ~10:08
    expect(solarHour(-115.2, date)).toBeCloseTo(((3 - 115.2 / 15) % 24 + 24) % 24, 3);
  });

  it("puts the sun up at noon and below the horizon at midnight", () => {
    expect(sunElevation(47.9, 310, 12)).toBeGreaterThan(15);
    expect(sunElevation(47.9, 310, 12)).toBeLessThan(30); // low November sun in UB
    expect(sunElevation(47.9, 310, 0)).toBeLessThan(-30);
    expect(sunElevation(13.75, 172, 12)).toBeGreaterThan(75); // near-overhead in Bangkok in June
    const dir = sunDirection(30, 9);
    expect(dir.y).toBeCloseTo(0.5, 2);
    expect(dir.x).toBeLessThan(0); // morning sun on the east side
  });

  it("picks the sky phase and turns the windows on at night", () => {
    expect(skyFor(40, 12)).toMatchObject({ phase: "day", windows: 0 });
    expect(skyFor(2, 7).phase).toBe("dawn");
    expect(skyFor(2, 17).phase).toBe("dusk");
    const night = skyFor(-30, 23);
    expect(night.phase).toBe("night");
    expect(night.windows).toBe(1);
    expect(night.sunLight).toBe(0);
    expect(night.sky).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("seasons follow the hemisphere", () => {
    expect(seasonOf(1, 47)).toBe("winter");
    expect(seasonOf(7, 47)).toBe("summer");
    expect(seasonOf(7, -33)).toBe("winter");
    expect(seasonOf(11, 40)).toBe("autumn");
  });
});

describe("weather", () => {
  const lt = (month, day) => ({ year: 2026, month, day });
  it("is stable within a day and fits the climate", () => {
    const ub = TOUR_STOPS[0];
    expect(weatherFor(ub, lt(1, 15))).toEqual(weatherFor(ub, lt(1, 15)));
    const vegas = TOUR_STOPS.find((s) => s.id === "lasvegas");
    for (let d = 1; d <= 28; d++) expect(["clear", "cloud"]).toContain(weatherFor(vegas, lt(7, d)).kind);
    const bangkok = TOUR_STOPS.find((s) => s.id === "bangkok");
    for (let d = 1; d <= 28; d++) expect(weatherFor(bangkok, lt(1, d)).kind).not.toBe("snow");
  });
  it("snows sometimes in a Mongolian winter", () => {
    const ub = TOUR_STOPS[0];
    const kinds = new Set(Array.from({ length: 60 }, (_, d) => weatherFor(ub, lt(1 + Math.floor(d / 28), (d % 28) + 1)).kind));
    expect(kinds.has("snow")).toBe(true);
  });
});

describe("procedural city", () => {
  it("is deterministic and keeps the arena plaza, avenues and river clear", () => {
    for (const stop of TOUR_STOPS) {
      const a = cityLayout(stop), b = cityLayout(stop);
      expect(a).toEqual(b);
      expect(a.length).toBeGreaterThan(30);
      for (const bd of a) {
        expect(Math.hypot(bd.x, bd.z)).toBeGreaterThan(6);
        expect(bd.h).toBeGreaterThan(0);
        expect(stop.city.palette).toContain(bd.color);
      }
      // Grid cells on the water are skipped; only the small position jitter can touch the bank.
      if (stop.city.water) expect(a.filter((bd) => isWater(stop, bd.x, bd.z)).length).toBeLessThanOrEqual(Math.ceil(a.length * 0.03));
    }
  });
  it("New York is taller than Ulaanbaatar", () => {
    const tallest = (id) => Math.max(...cityLayout(TOUR_STOPS.find((s) => s.id === id)).map((b) => b.h));
    expect(tallest("newyork")).toBeGreaterThan(tallest("ulaanbaatar"));
  });
  it("terrain is flat in the city and rises into mountains around Ulaanbaatar", () => {
    const ub = terrainFor(TOUR_STOPS[0]);
    expect(Math.abs(ub(0, 0))).toBeLessThan(0.2);
    expect(Math.abs(ub(20, 10))).toBeLessThan(0.2);
    const far = Math.max(...Array.from({ length: 36 }, (_, i) => ub(Math.cos(i / 6) * 75, Math.sin(i / 6) * 75)));
    expect(far).toBeGreaterThan(3);
    const london = terrainFor(TOUR_STOPS.find((s) => s.id === "london"));
    expect(Math.abs(london(75, 0))).toBeLessThan(0.2);
  });
});
