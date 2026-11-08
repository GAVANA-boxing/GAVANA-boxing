import { describe, it, expect } from "vitest";
import { coverFit, toBox } from "@/lib/pose/overlayGeometry";

describe("overlay geometry (object-fit: cover)", () => {
  it("maps a 640×480 landscape frame into a tall phone box", () => {
    const fit = coverFit(640, 480, 360, 700);
    // cover scales by height: 700/480; frame is wider than the box, sides are cropped
    expect(fit.scale).toBeCloseTo(700 / 480, 6);
    const centre = toBox({ x: 0.5, y: 0.5 }, 640, 480, fit);
    expect(centre.x).toBeCloseTo(180, 6);
    expect(centre.y).toBeCloseTo(350, 6);
    const left = toBox({ x: 0, y: 0 }, 640, 480, fit);
    expect(left.x).toBeLessThan(0); // cropped off screen
  });
  it("returns null until the video has a size", () => {
    expect(coverFit(0, 0, 360, 700)).toBeNull();
  });
});
