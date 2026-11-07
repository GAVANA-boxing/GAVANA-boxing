import { describe, it, expect } from "vitest";
import { analyzeStancePhoto } from "@/lib/stanceFromPose";

// Build a 33-point pose. leadZ: how much closer (negative z) the lead side is.
function pose({ lead = "left", leadZ = 0.12, wristY = 0.25, ankleGap = 0.24, vis = 1 } = {}) {
  const p = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: vis }));
  p[0] = { x: 0.5, y: 0.2, z: 0, visibility: 1 }; // nose
  const set = (i, x, y) => { p[i] = { x, y, z: 0, visibility: vis }; };
  set(11, 0.6, 0.3); set(12, 0.4, 0.3);          // shoulders (width 0.2)
  set(13, 0.62, 0.4); set(14, 0.38, 0.4);        // elbows
  set(15, 0.56, wristY); set(16, 0.44, wristY);  // wrists
  set(23, 0.56, 0.55); set(24, 0.44, 0.55);      // hips
  set(25, 0.57, 0.7); set(26, 0.43, 0.7);        // knees
  set(27, 0.5 + ankleGap / 2, 0.9); set(28, 0.5 - ankleGap / 2, 0.9); // ankles
  const leadIdx = lead === "left" ? [11, 13, 15, 23, 25, 27] : [12, 14, 16, 24, 26, 28];
  for (const i of leadIdx) p[i].z = -leadZ;
  return p;
}

describe("analyzeStancePhoto", () => {
  it("left side closer → orthodox", () => {
    const r = analyzeStancePhoto(pose({ lead: "left" }));
    expect(r.ok).toBe(true);
    expect(r.stance).toBe("orthodox");
    expect(r.lead).toBe("left");
    expect(r.confidence).toBeGreaterThan(0.3);
  });

  it("right side closer → southpaw", () => {
    const r = analyzeStancePhoto(pose({ lead: "right" }));
    expect(r.stance).toBe("southpaw");
    expect(r.lead).toBe("right");
  });

  it("square to the camera → not sure", () => {
    expect(analyzeStancePhoto(pose({ leadZ: 0 }))).toEqual({ ok: false, reason: "square_on" });
  });

  it("missing or hidden body → error reasons", () => {
    expect(analyzeStancePhoto(null).reason).toBe("no_pose");
    expect(analyzeStancePhoto([]).reason).toBe("no_pose");
    expect(analyzeStancePhoto(pose({ vis: 0.1 })).reason).toBe("body_not_visible");
  });

  it("guard height from wrists vs nose / shoulders", () => {
    expect(analyzeStancePhoto(pose({ wristY: 0.22 })).guard).toBe("high");
    expect(analyzeStancePhoto(pose({ wristY: 0.32 })).guard).toBe("mid");
    expect(analyzeStancePhoto(pose({ wristY: 0.5 })).guard).toBe("low");
  });

  it("foot width relative to shoulders", () => {
    expect(analyzeStancePhoto(pose({ ankleGap: 0.1 })).footWidthLabel).toBe("narrow");
    expect(analyzeStancePhoto(pose({ ankleGap: 0.24 })).footWidthLabel).toBe("good");
    expect(analyzeStancePhoto(pose({ ankleGap: 0.45 })).footWidthLabel).toBe("wide");
  });

  it("uses separate image landmarks for guard when given", () => {
    const world = pose({ lead: "left" });
    const image = pose({ lead: "left", wristY: 0.5 });
    expect(analyzeStancePhoto(world, image).guard).toBe("low");
  });
});
