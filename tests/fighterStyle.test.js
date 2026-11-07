import { describe, it, expect } from "vitest";
import { fighterStyle, sanitizeStylePrefs, seedUnit, SKIN_TONES, HAIR_STYLES, BUILDS } from "@/lib/avatar/fighterStyle";
import { RANK_TIERS } from "@/lib/xp";

describe("fighterStyle", () => {
  it("is deterministic for a seed and varies between seeds", () => {
    expect(fighterStyle({ seed: "uid-a" })).toEqual(fighterStyle({ seed: "uid-a" }));
    const looks = new Set(["a", "b", "c", "d", "e", "f", "g", "h"].map((s) => {
      const st = fighterStyle({ seed: s });
      return `${st.skin}|${st.hair}`;
    }));
    expect(looks.size).toBeGreaterThan(3);
  });

  it("prefs override the seed", () => {
    const st = fighterStyle({ seed: "x", prefs: { skin: 4, hair: "bun", hairColor: 3, build: "heavy" } });
    expect(st.skin).toBe(SKIN_TONES[4]);
    expect(st.hair).toBe("bun");
    expect(st.build).toBe(BUILDS.heavy);
    expect(st.buildKey).toBe("heavy");
  });

  it("rank colour on gloves and trim; rookies get red gloves", () => {
    const rookie = fighterStyle({ xp: 0 });
    expect(rookie.trim).toBe(RANK_TIERS[0].color);
    expect(rookie.glove).toBe("#e0261c");
    const top = RANK_TIERS[RANK_TIERS.length - 1];
    const champ = fighterStyle({ xp: top.minXP + 10 });
    expect(champ.glove).toBe(top.color);
    expect(champ.rankKey).toBe(top.key);
  });

  it("bad xp falls back to rookie", () => {
    expect(fighterStyle({ xp: NaN }).rankKey).toBe(RANK_TIERS[0].key);
  });
});

describe("sanitizeStylePrefs", () => {
  it("drops unknown or out-of-range values", () => {
    expect(sanitizeStylePrefs({ skin: 99, hair: "mohawk", hairColor: -1, build: "giant", x: 1 })).toEqual({});
    expect(sanitizeStylePrefs(null)).toEqual({});
    expect(sanitizeStylePrefs({ skin: 0, hair: HAIR_STYLES[1], build: "lean" })).toEqual({ skin: 0, hair: "buzz", build: "lean" });
  });
});

describe("seedUnit", () => {
  it("returns [0,1) and depends on salt", () => {
    for (const s of ["", "a", "uid-123"]) {
      const u = seedUnit(s, 1);
      expect(u).toBeGreaterThanOrEqual(0);
      expect(u).toBeLessThan(1);
    }
    expect(seedUnit("a", 1)).not.toBe(seedUnit("a", 2));
  });
});
