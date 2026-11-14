// Every Boxing Academy lesson must render on Train in every language. (2026-11: the lesson cards
// printed localized objects { mn, ko, en } raw — React threw and the whole page fell into the
// error screen for all 10 lessons.)
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ACADEMY_LESSONS } from "@/lib/academyLessons";
import TrainingFocusCard from "@/components/train/TrainingFocusCard";
import AcademyLessonCard from "@/components/train/AcademyLessonCard";
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
        for (const cue of lesson.keyCues || []) expect(html).toContain(escapeHtml(tx(cue, locale)));
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

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}
