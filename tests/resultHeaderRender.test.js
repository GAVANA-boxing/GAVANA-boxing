// The result hero must say the right thing for each kind of round. (2026-11 audit: every valid
// result first painted as "Not enough data"; a timer-only round was told "get your whole body in
// frame"; the punch-mix legend was English in every language.)
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ResultHeader from "@/components/train/ResultHeader";

const t = (k) => k;
const base = {
  tooFewPunches: false, effectivePunchCount: 14, minPunches: 5, identity: { title: "Counter" },
  displayScore: 0, finalScore: 7.4, scoreConf: "high", locale: "mn", t,
  punchBreakdown: { jab: { count: 8 }, cross: { count: 4 }, hook: { count: 2 } },
};
const html = (over) => renderToStaticMarkup(<ResultHeader {...base} {...over} />);

describe("ResultHeader", () => {
  it("shows the score from the first frame (count-up still at 0)", () => {
    const out = html({});
    expect(out).not.toContain("Хангалтгүй өгөгдөл");
    expect(out).toContain("/10");
    expect(out).toContain("scoreConfidenceHigh");
  });
  it("localizes the punch mix", () => {
    expect(html({})).toContain("Жэб 8");
    expect(html({ locale: "ko" })).toContain("잽 8");
    expect(html({ locale: "en" })).toContain("Jab 8");
    expect(html({})).not.toContain("Jab");
  });
  it("too few punches: no score, no confidence label, says how many were counted", () => {
    const out = html({ tooFewPunches: true, effectivePunchCount: 4 });
    expect(out).toContain("Хангалтгүй өгөгдөл");
    expect(out).toContain("4 бүртгэгдсэн");
    expect(out).not.toContain("/10");
    expect(out).not.toContain("scoreConfidenceHigh");
  });
  it("timer-only round: says the camera was off, not 'get your body in frame'", () => {
    const out = html({ tooFewPunches: true, effectivePunchCount: 0, finalScore: 0, cameraOff: true });
    expect(out).toContain("Раунд дууслаа");
    expect(out).toContain("Камер унтраалттай");
    expect(out).not.toContain("Бүтэн биеэ кадрт");
  });
});
