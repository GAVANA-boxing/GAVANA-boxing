import { describe, it, expect } from "vitest";
import { techniquePacks, TECHNIQUE_PACKS, techniqueSlug, techniqueTitle, drillProgressId } from "@/lib/techniquePacks";
import { FIGHTER_TECHNIQUES } from "@/lib/fighterTechniques";
import { FIGHTERS } from "@/lib/fighters";

import { PRESET_DRILLS, drillChipName } from "../components/train/DrillChips.js";
import { DRILLS } from "../lib/drillConfig.js";

describe("technique packs", () => {
  const packs = techniquePacks("mn");
  const all = packs.flatMap((p) => p.drills);
  const total = Object.values(FIGHTER_TECHNIQUES).reduce((n, l) => n + l.length, 0);

  it("every drill is in exactly one pack", () => {
    expect(all.length).toBe(total);
    expect(new Set(all.map((d) => d.id)).size).toBe(total);
    expect(packs.length).toBe(TECHNIQUE_PACKS.length);
    for (const p of packs) expect(p.drills.length).toBeGreaterThanOrEqual(5);
  });
  it("titles exist in three languages and none is empty", () => {
    for (const d of all) for (const k of ["mn", "ko", "en"]) expect(String(d.title[k] || "").trim().length, `${d.id} ${k}`).toBeGreaterThan(2);
  });
  it("no boxer's name in a pack title or pack name", () => {
    const names = FIGHTERS.flatMap((f) => String(f.name || "").split(/\s+/)).filter((w) => w.length >= 5);
    const text = [...all.flatMap((d) => Object.values(d.title)), ...TECHNIQUE_PACKS.flatMap((p) => Object.values(p.name))].join(" | ");
    for (const n of names) expect(text).not.toContain(n);
  });
  it("the link opens the drill the Train page looks up (same slug rule)", () => {
    for (const [fighterId, lessons] of Object.entries(FIGHTER_TECHNIQUES)) {
      lessons.forEach((l, i) => {
        const d = all.find((x) => x.id === `${fighterId}/${i}`);
        const u = new URL(d.url, "http://x");
        expect(u.searchParams.get("fighter")).toBe(fighterId);
        const slug = u.searchParams.get("lesson");
        expect(slug).toBe(techniqueSlug(l.title));
        expect(lessons.find((x) => x.title.toLowerCase().replace(/\s+/g, "-") === slug)).toBe(l);
        expect(FIGHTERS.find((f) => f.id === fighterId)).toBeTruthy();
      });
    }
  });
  it("techniqueTitle gives the Mongolian / Korean / English title; unknown → null", () => {
    expect(techniqueTitle("mike-tyson", 0)).toEqual({ mn: "Толгойн хамгаалалттай орох", ko: "가드 올리고 들어가기", en: "Peekaboo Entry" });
    expect(techniqueTitle("nobody", 0)).toBeNull();
  });
  it("drill progress key matches the pack drill id; a valid round marks it done, too few punches nothing", async () => {
    const { nextLessonEntry } = await import("../lib/academyProgress.js");
    const d = techniquePacks("mn")[0].drills[0];
    expect(`drill:${d.id}`).toBe(drillProgressId(...d.id.split("/")));
    expect(nextLessonEntry(null, `drill:${d.id}`, { score: 4, punches: 8, dateKey: "2026-11-23" }).completed).toBe(true);
    expect(nextLessonEntry(null, `drill:${d.id}`, { score: 4, punches: 2 })).toBeNull();
  });
});

describe("DrillChips", () => {
  it("every preset exists in drillConfig and has a Mongolian name", () => {
    for (const id of PRESET_DRILLS) {
      expect(DRILLS[id]).toBeTruthy();
      expect(drillChipName("mn", id)).not.toBe(id);
    }
  });
});
