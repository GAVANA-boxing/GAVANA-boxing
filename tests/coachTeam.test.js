import { describe, it, expect } from "vitest";
import {
  CODE_LENGTH, clampRounds, cleanDrill, cleanTeamName, dayStartMs, daysAgo, makeTeamCode, normalizeCode,
  sortStudents, summarizeStudent, toMs,
} from "@/lib/coach/team";

const H = 3_600_000;
const D = 24 * H;
const UB = -480; // Ulaanbaatar, UTC+8 (Date#getTimezoneOffset)

describe("invite code", () => {
  it("has the right length and only unambiguous characters", () => {
    let i = 0;
    const code = makeTeamCode((n) => (i++ * 7) % n);
    expect(code).toHaveLength(CODE_LENGTH);
    expect(code).toMatch(/^[A-HJKMNP-Z2-9]+$/);
  });
  it("normalizes what people type, rejects the rest", () => {
    expect(normalizeCode(" k7m-4qx ")).toBe("K7M4QX");
    expect(normalizeCode("K7M4Q")).toBeNull();      // too short
    expect(normalizeCode("K7M4Q0")).toBeNull();     // 0 isn't in the alphabet
    expect(normalizeCode(null)).toBeNull();
  });
});

describe("assignment fields", () => {
  it("rounds per day 1..10, drill from the benchmark list, short name", () => {
    expect(clampRounds(0)).toBe(1);
    expect(clampRounds(25)).toBe(10);
    expect(clampRounds("x")).toBe(3);
    expect(cleanDrill("jab-minute")).toBe("jab-minute");
    expect(cleanDrill("anything")).toBeNull();
    expect(cleanTeamName("   Ширэн   Бээлий ")).toBe("Ширэн Бээлий");
    expect(cleanTeamName("")).toBeNull();
  });
});

describe("days in the viewer's time zone", () => {
  it("today starts at local midnight (UB)", () => {
    const now = Date.UTC(2026, 10, 10, 1, 0); // 09:00 in UB
    expect(new Date(dayStartMs(now, UB)).toISOString()).toBe("2026-11-09T16:00:00.000Z"); // UB midnight
  });
  it("days ago counts calendar days, not 24 h blocks", () => {
    const now = Date.UTC(2026, 10, 10, 1, 0);
    expect(daysAgo(now - 2 * H, now, UB)).toBe(0);
    expect(daysAgo(now - 10 * H, now, UB)).toBe(1); // 23:00 yesterday in UB
    expect(daysAgo(null, now, UB)).toBeNull();
  });
  it("toMs reads REST ISO strings, Timestamps and {seconds}", () => {
    expect(toMs("2026-11-10T00:00:00Z")).toBe(Date.UTC(2026, 10, 10));
    expect(toMs({ seconds: 10 })).toBe(10_000);
    expect(toMs({ toMillis: () => 5 })).toBe(5);
    expect(toMs("nope")).toBe(0);
  });
});

describe("student summary", () => {
  const now = Date.UTC(2026, 10, 10, 6, 0); // 14:00 in UB
  const round = (msAgo, score, type) => ({ createdAt: new Date(now - msAgo).toISOString(), score, type });

  it("counts today (local) and the last 7 days, ignores non-training docs", () => {
    const s = summarizeStudent([
      round(1 * H, 7.1), round(3 * H, 6.8),                 // today
      round(20 * H, 6.0),                                   // yesterday (local)
      round(6 * D, 5.5), round(8 * D, 5.0),                 // in / out of the week
      round(2 * H, 9.9, "pvp"),                             // not a training round
    ], { now, tzOffsetMin: UB, roundsPerDay: 3 });
    expect(s).toMatchObject({ today: 2, goal: 3, doneToday: false, week: 4, lastScore: 7.1, rounds: 5 });
    expect(s.lastAt).toBe(now - H);
    expect(s.glance).toEqual({ start: 5.3, now: 7, delta: 1.7 }); // first 2 [5.0, 5.5] vs latest 2 [7.1, 6.8]
  });

  it("no rounds → zeros and no comparison", () => {
    expect(summarizeStudent([], { now })).toMatchObject({ today: 0, week: 0, lastAt: null, lastScore: null, glance: null, doneToday: false });
  });

  it("students who still owe today's rounds come first", () => {
    const mk = (name, doneToday, week) => ({ name, summary: { doneToday, week } });
    const order = sortStudents([mk("Bat", true, 9), mk("Dorj", false, 4), mk("Anu", false, 1), mk("Saraa", false, 1)]);
    expect(order.map((x) => x.name)).toEqual(["Anu", "Saraa", "Dorj", "Bat"]);
  });
});
