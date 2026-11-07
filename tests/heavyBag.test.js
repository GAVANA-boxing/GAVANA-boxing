import { describe, it, expect } from "vitest";
import { punchImpulse, createBagWorld, hitBag, stepBag, swingDeg, createBagStats, BAG } from "@/lib/heavyBag";
import { qualityFor } from "@/lib/three/renderCaps";

const run = (w, seconds) => { for (let t = 0; t < seconds; t += 1 / 60) stepBag(w, 1 / 60); };

describe("punchImpulse", () => {
  it("cross is heavier than jab, faster snaps hit harder", () => {
    const jab = punchImpulse({ type: "jab", hand: "left" });
    const cross = punchImpulse({ type: "cross", hand: "right" });
    expect(cross.power).toBeGreaterThan(jab.power);
    expect(punchImpulse({ type: "jab", hand: "left", snapVelocity: 0.6 }).power).toBeGreaterThan(punchImpulse({ type: "jab", hand: "left", snapVelocity: 0.05 }).power);
    expect(cross.power).toBeLessThanOrEqual(100);
  });

  it("straights push into the bag, hooks come across, uppercuts lift", () => {
    expect(punchImpulse({ type: "cross", hand: "right" }).impulse.z).toBeLessThan(0);
    const leftHook = punchImpulse({ type: "hook", hand: "left" });
    const rightHook = punchImpulse({ type: "hook", hand: "right" });
    expect(Math.sign(leftHook.impulse.x)).toBe(-Math.sign(rightHook.impulse.x));
    expect(Math.abs(leftHook.impulse.x)).toBeGreaterThan(Math.abs(leftHook.impulse.z));
    expect(punchImpulse({ type: "uppercut", hand: "right" }).impulse.y).toBeGreaterThan(0);
  });

  it("lands on the hand's side of the bag; southpaw flips the guess", () => {
    expect(punchImpulse({ type: "jab", hand: "left" }).point.x).toBeLessThan(0);
    expect(punchImpulse({ type: "cross", hand: "right" }).point.x).toBeGreaterThan(0);
    expect(punchImpulse({ type: "jab" }, "orthodox").point.x).toBeLessThan(0);
    expect(punchImpulse({ type: "jab" }, "southpaw").point.x).toBeGreaterThan(0);
  });
});

describe("bag physics (cannon-es)", () => {
  it("hangs still, swings when hit, and settles again", () => {
    const w = createBagWorld();
    run(w, 1);
    expect(swingDeg(w)).toBeLessThan(1); // the soft joint settles within a centimetre
    const startY = w.bag.position.y;
    expect(startY).toBeCloseTo(BAG.anchorY - BAG.chain - BAG.height / 2, 1);

    hitBag(w, { type: "cross", hand: "right", snapVelocity: 0.5 });
    let peak = 0, minZ = 0, firstMove = null;
    for (let t = 0; t < 1.5; t += 1 / 60) {
      stepBag(w, 1 / 60);
      peak = Math.max(peak, swingDeg(w));
      minZ = Math.min(minZ, w.bag.position.z);
      if (firstMove === null && Math.abs(w.bag.position.z) > 0.02) firstMove = Math.sign(w.bag.position.z);
    }
    expect(peak).toBeGreaterThan(8);
    expect(peak).toBeLessThan(60);
    expect(firstMove).toBe(-1);      // a straight punch drives the bag away from the viewer first
    expect(minZ).toBeLessThan(-0.1);

    run(w, 25);
    expect(swingDeg(w)).toBeLessThan(peak / 3);
  });

  it("stays on its chain (constraint holds)", () => {
    const w = createBagWorld();
    for (let k = 0; k < 20; k++) { hitBag(w, { type: k % 2 ? "cross" : "hook", hand: k % 2 ? "right" : "left", snapVelocity: 0.6 }); run(w, 0.2); }
    const top = w.bag.pointToWorldFrame(new (w.bag.position.constructor)(0, BAG.height / 2 + BAG.chain, 0));
    expect(top.distanceTo(w.anchor.position)).toBeLessThan(0.05);
  });
});

describe("bag stats", () => {
  it("sums a round", () => {
    const s = createBagStats();
    s.add("jab", 40); s.add("cross", 80); s.add("jab", 45); s.swing(12); s.swing(20);
    expect(s.summary(30)).toEqual({ punches: 3, avgPower: 55, bestPower: 80, maxSwingDeg: 20, perMinute: 6, byType: { jab: 2, cross: 1 } });
    expect(createBagStats().summary(0)).toMatchObject({ punches: 0, avgPower: 0, perMinute: 0 });
  });
});

describe("render quality tier", () => {
  it("picks low / medium / high", () => {
    expect(qualityFor({ webgl2: false }).tier).toBe("low");
    expect(qualityFor({ webgl2: true, mobile: true, cores: 4 }).tier).toBe("low");
    expect(qualityFor({ webgl2: true, mobile: true, cores: 8, memoryGb: 4, dpr: 3 })).toMatchObject({ tier: "medium", pixelRatio: 2, shadows: true });
    expect(qualityFor({ webgl2: true, webgpu: true, mobile: true, cores: 8, dpr: 3 })).toMatchObject({ tier: "high", webgpu: true, pixelRatio: 2.5 });
    expect(qualityFor({ webgl2: true, cores: 12, memoryGb: 16 }).tier).toBe("high");
    expect(qualityFor({ reducedMotion: true }).motion).toBe(false);
  });
});
