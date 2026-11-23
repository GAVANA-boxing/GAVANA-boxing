// Home v2: the hero and the stats draw only what is known. (Design panel notes: an XP number with
// no target, a streak that contradicts the week, dashes for scores that do not exist yet.)
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HomeHero, HomeStats } from "@/components/home/HomeHero";
import { ScoreDial, WeekDots } from "@/components/ui/gauges";

const hero = (over = {}) => renderToStaticMarkup(
  <HomeHero locale="mn" name="Бат" rankName="Хүрэл бүс" xp={1240} rankPct={62} nextRankName="Мөнгөн бүс" xpToNext={760} streak={3} onStart={() => {}} {...over} />,
);
const d = (trained, past, today = false) => ({ trained, past, today });
const WEEK = { days: [d(false, true), d(true, true), d(true, true), d(true, false, true), d(false, false), d(false, false), d(false, false)], trainedCount: 3 };
const stats = (over = {}) => renderToStaticMarkup(
  <HomeStats locale="mn" week={WEEK} weekLabels={["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"]} rounds={14} avg={6.8} best={8.4} trend={0.4} onOpen={() => {}} {...over} />,
);

describe("HomeHero", () => {
  it("says how much XP is LEFT and to which rank — never a bare total beside the bar", () => {
    const html = hero();
    expect(html).toContain("760 XP");
    expect(html).toContain("Мөнгөн бүс хүртэл");
    expect(html).not.toContain("1,240");
  });
  it("top rank: the total, with no 'to …' line", () => {
    const html = hero({ nextRankName: null, xpToNext: null, rankPct: 100, xp: 52000 });
    expect(html).toContain("52,000 XP");
    expect(html).not.toContain("хүртэл");
  });
  it("no streak → no chip (and no empty slot text)", () => {
    expect(hero({ streak: 0 })).not.toContain('data-testid="home-streak"');
    expect(hero({ streak: 3 })).toContain("3 өдөр дараалан");
  });
  it("one primary action", () => {
    const html = hero();
    expect(html.match(/<button/g).length).toBe(1);
    expect(html).toContain("Раунд эхлэх");
  });
  it("a long rank name gets a smaller size instead of pushing the card apart", () => {
    const size = (name) => Number(hero({ rankName: name }).match(/data-testid="home-rank" style="[^"]*font-size:min\((\d+)px/)[1]);
    expect(size("Хүрэл бүс")).toBeGreaterThan(size("Сонирхогч бүс"));
    expect(size("Сонирхогч бүс")).toBeGreaterThan(size("Дэлхийн аварга шалгаруулагч"));
  });
  it("the fighter image is decorative and is our own render, in the chosen avatar", () => {
    expect(hero()).toContain("hero-fighter-m-v2.webp");
    expect(hero({ avatar: "f" })).toContain("hero-fighter-f-v2.webp");
    expect(hero()).toContain('alt=""');
  });
  it("mn / ko have no English words", () => {
    for (const locale of ["mn", "ko"]) {
      const html = hero({ locale });
      for (const en of ["Start a round", "days in a row", " to "]) expect(html).not.toContain(en);
    }
  });
});

describe("HomeStats", () => {
  it("scores with their scale, and the recent change", () => {
    const html = stats();
    expect(html).toContain("6.8");
    expect(html).toContain("8.4");
    expect(html.match(/\/10/g).length).toBeGreaterThanOrEqual(2);
    expect(html).toContain('data-testid="home-trend"');
    expect(html).toContain("▲");
  });
  it("a falling average shows ▼; no change or not enough rounds shows no chip", () => {
    expect(stats({ trend: -0.3 })).toContain("▼");
    expect(stats({ trend: 0 })).not.toContain('data-testid="home-trend"');
    expect(stats({ trend: null })).not.toContain('data-testid="home-trend"');
  });
  it("no scored round yet → no score tile at all (not two dashes)", () => {
    const html = stats({ rounds: 0, avg: null, best: null, trend: null, week: { days: WEEK.days.map((x) => ({ ...x, trained: false })), trainedCount: 0 } });
    expect(html).not.toContain('data-testid="home-scores"');
    expect(html).not.toContain('data-testid="home-week-count"');
    expect(html).not.toContain("—");
  });
  it("the week count is days trained, not 'n/7'", () => {
    const html = stats();
    expect(html).toContain('data-testid="home-week-count"');
    expect(html).not.toContain("/7");
  });
});

describe("gauges", () => {
  it("WeekDots: trained, today, missed and still-to-come days are four different states", () => {
    const html = renderToStaticMarkup(<WeekDots days={WEEK.days} labels={["a", "b", "c", "d", "e", "f", "g"]} />);
    expect(html.match(/data-day="missed"/g).length).toBe(1);
    expect(html.match(/data-day="trained"/g).length).toBe(3);
    expect(html.match(/data-day="ahead"/g).length).toBe(3);
    const idle = renderToStaticMarkup(<WeekDots days={[d(false, true), d(false, false, true), d(false, false)]} />);
    expect(idle).toContain('data-day="today"');
  });
  it("ScoreDial: clamps, and an unknown value is a dash with no scale", () => {
    expect(renderToStaticMarkup(<ScoreDial value={7.25} label="x" />)).toContain("7.3");
    expect(renderToStaticMarkup(<ScoreDial value={99} label="x" />)).toContain("99.0"); // the number is shown as it is; only the arc is clamped
    const none = renderToStaticMarkup(<ScoreDial value={null} label="x" />);
    expect(none).toContain("—");
    expect(none).not.toContain("/10");
  });
});
