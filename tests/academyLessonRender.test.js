// Every Boxing Academy lesson must render on Train in every language. (2026-11: the lesson cards
// printed localized objects { mn, ko, en } raw — React threw and the whole page fell into the
// error screen for all 10 lessons.)
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ACADEMY_LESSONS } from "@/lib/academyLessons";
import { FIGHTER_TECHNIQUES } from "@/lib/fighterTechniques";
import TrainingFocusCard from "@/components/train/TrainingFocusCard";
import AcademyLessonCard from "@/components/train/AcademyLessonCard";
import AcademyNextCard from "@/components/train/AcademyNextCard";
import { FIGHTERS } from "@/lib/fighters";
import { tx } from "@/lib/loc";

const LOCALES = ["mn", "ko", "en"];
const router = { push() {} };

describe("tx — localized text is always a string", () => {
  it("handles strings, localized objects, fallbacks and junk", () => {
    expect(tx("Jab", "mn")).toBe("Jab");
    expect(tx({ mn: "Жэб", ko: "잽", en: "Jab" }, "mn")).toBe("Жэб");
    expect(tx({ en: "Jab" }, "ko")).toBe("Jab");
    expect(tx({ mn: { nested: 1 } }, "mn")).toBe("");
    expect(tx(null, "en")).toBe("");
    expect(tx(undefined, "en")).toBe("");
  });
});

describe("Boxing Academy lessons render", () => {
  it("there are lessons to test", () => {
    expect(ACADEMY_LESSONS.length).toBeGreaterThanOrEqual(10);
  });

  for (const lesson of ACADEMY_LESSONS) {
    for (const locale of LOCALES) {
      it(`${lesson.id} · ${locale}: focus card (before the round)`, () => {
        const html = renderToStaticMarkup(
          <TrainingFocusCard academyLesson={lesson} accent={lesson.accentColor} locale={locale} router={router} onStart={() => {}} />,
        );
        expect(html).toContain(tx(lesson.title, locale));
        expect(html).not.toContain("[object Object]");
        // Three cues at most before the round; the mistake and the drill steps wait behind "More".
        const cues = (lesson.keyCues || []).map((c) => tx(c, locale)).filter(Boolean);
        for (const cue of cues.slice(0, 3)) expect(html).toContain(escapeHtml(cue));
        for (const cue of cues.slice(3)) expect(html).not.toContain(escapeHtml(cue));
        expect(html).not.toContain(escapeHtml(tx(lesson.commonMistake, locale)));
        expect(html).toContain('data-testid="lesson-start"');
      });

      it(`${lesson.id} · ${locale}: lesson card (after the round)`, () => {
        for (const score of [3.2, 8.4]) {
          const html = renderToStaticMarkup(
            <AcademyLessonCard academyLesson={lesson} result={{ score }} locale={locale} router={router} />,
          );
          expect(html).toContain(escapeHtml(tx(lesson.title, locale)));
          expect(html).not.toContain("[object Object]");
        }
      });
    }
  }
});

// Fighter lessons (lib/fighterTechniques.js) open on Train from /train?fighter=…&lesson=…. Their
// fields are localized objects too; `bodyCue` was still printed raw after the first fix.
describe("fighter technique lessons render on Train", () => {
  const all = Object.entries(FIGHTER_TECHNIQUES).flatMap(([fighterId, lessons]) => lessons.map((lesson) => ({ fighterId, lesson })));
  it("there are lessons to test", () => {
    expect(all.length).toBeGreaterThanOrEqual(10);
  });
  for (const { fighterId, lesson } of all) {
    for (const locale of LOCALES) {
      it(`${fighterId} / ${tx(lesson.title, "en")} · ${locale}: focus card`, () => {
        const html = renderToStaticMarkup(
          <TrainingFocusCard fighterName={fighterId} lesson={lesson} accent="#F5C451" locale={locale} router={router} onStart={() => {}} />,
        );
        expect(html).not.toContain("[object Object]");
        expect(html).toContain(escapeHtml(tx(lesson.title, locale)));
        if (lesson.bodyCue) expect(html).toContain(escapeHtml(tx(lesson.bodyCue, locale)));
      });
    }
  }
});

describe("lesson cards: little text, honest status, every language", () => {
  const jab = ACADEMY_LESSONS.find((l) => l.id === "jab-mechanics");
  const slip = ACADEMY_LESSONS.find((l) => l.id === "slip-defense");
  const last = ACADEMY_LESSONS[ACADEMY_LESSONS.length - 1];

  it("the focus card has no English labels in mn / ko", () => {
    for (const locale of ["mn", "ko"]) {
      const html = renderToStaticMarkup(<TrainingFocusCard academyLesson={jab} accent={jab.accentColor} locale={locale} onStart={() => {}} />);
      for (const en of ["GAVANA ACADEMY", "START THIS DRILL", "Key Cues", "BEGINNER", "Academy lesson", "More"]) expect(html).not.toContain(en);
    }
  });
  it("a technique drill never prints a boxer's name", () => {
    const names = FIGHTERS.flatMap((f) => [f.name, f.nickname]).filter(Boolean);
    expect(names.length).toBeGreaterThan(5);
    for (const [fighterId, lessons] of Object.entries(FIGHTER_TECHNIQUES)) {
      const html = renderToStaticMarkup(<TrainingFocusCard lesson={lessons[0]} accent="#F5C451" locale="en" onStart={() => {}} />);
      for (const n of names) expect(html, `${fighterId}: ${n}`).not.toContain(escapeHtml(n));
    }
  });
  it("punch lesson under the pass score: shows the score against 6.5 and offers another go", () => {
    const html = renderToStaticMarkup(<AcademyLessonCard academyLesson={jab} result={{ score: 5 }} punches={12} locale="mn" router={router} />);
    expect(html).toContain("5.0 / 6.5");
    expect(html).toContain('data-testid="academy-again"');
    expect(html).not.toContain("Хийгдсэн");
  });
  it("punch lesson at the pass score: done, next lesson offered", () => {
    const html = renderToStaticMarkup(<AcademyLessonCard academyLesson={jab} result={{ score: 6.5 }} punches={12} locale="mn" router={router} />);
    expect(html).toContain("✓ Хийгдсэн");
    expect(html).toContain('data-testid="academy-next-lesson"');
  });
  it("defence lesson: done by completing the round — never 'passed' or 'failed' by a punch score", () => {
    const html = renderToStaticMarkup(<AcademyLessonCard academyLesson={slip} result={{ score: 3.2 }} punches={9} locale="en" router={router} />);
    expect(html).toContain("✓ Done");
    expect(html).not.toContain("6.5");
  });
  it("the last lesson, done: says so instead of offering a next one", () => {
    const html = renderToStaticMarkup(<AcademyLessonCard academyLesson={last} result={{ score: 8 }} punches={9} locale="en" router={router} />);
    expect(html).toContain("All lessons done");
    expect(html).not.toContain('data-testid="academy-next-lesson"');
  });
});

describe("AcademyNextCard — the next lesson, with real progress", () => {
  const first = ACADEMY_LESSONS[0], second = ACADEMY_LESSONS[1];
  it("nothing done → lesson 1", () => {
    const html = renderToStaticMarkup(<AcademyNextCard lessonProgress={{}} locale="en" router={router} />);
    expect(html).toContain("Lesson 1");
    expect(html).toContain(escapeHtml(tx(first.title, "en")));
    expect(html).toContain('aria-label="0/10"');
  });
  it("first lesson done → lesson 2, 1/10", () => {
    const html = renderToStaticMarkup(<AcademyNextCard lessonProgress={{ [first.id]: { completed: true } }} locale="mn" router={router} />);
    expect(html).toContain("2-р хичээл");
    expect(html).toContain(escapeHtml(tx(second.title, "mn")));
    expect(html).toContain('aria-label="1/10"');
  });
  it("an attempted but unfinished lesson is still the next one", () => {
    const html = renderToStaticMarkup(<AcademyNextCard lessonProgress={{ [first.id]: { attempted: true, completed: false } }} locale="en" router={router} />);
    expect(html).toContain("Lesson 1");
  });
  it("all done → renders nothing", () => {
    const all = Object.fromEntries(ACADEMY_LESSONS.map((l) => [l.id, { completed: true }]));
    expect(renderToStaticMarkup(<AcademyNextCard lessonProgress={all} locale="en" router={router} />)).toBe("");
  });
});

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}
