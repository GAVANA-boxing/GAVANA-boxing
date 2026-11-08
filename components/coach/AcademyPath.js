"use client";

import { useState } from "react";
import { ACADEMY_LESSONS } from "@/lib/academyLessons";
import { useAcademyProgress } from "@/hooks/useAcademyProgress";
import { sectionLabel } from "@/components/ui/brand";

// Boxing Academy: the 10 technique lessons in order, with the fighter's progress. Each lesson
// is a guided round in Train (?academyLesson=<id>); a round scoring ≥ 6.5 completes it
// (hooks/useAcademyProgress). Before this, nothing in the app started lesson 1.
export default function AcademyPath({ user, locale, router }) {
  const L = (mn, ko, en) => (locale === "mn" ? mn : locale === "ko" ? ko : en);
  const { lessonProgress, loading } = useAcademyProgress({ user });
  const [open, setOpen] = useState(false);
  const done = ACADEMY_LESSONS.filter((l) => lessonProgress?.[l.id]?.completed).length;
  const next = ACADEMY_LESSONS.find((l) => !lessonProgress?.[l.id]?.completed) || null;
  const title = (l) => l.title?.[locale] || l.title?.en || l.id;
  const go = (l) => router.push(`/${locale}/train?academyLesson=${l.id}`);

  return (
    <section data-testid="academy-path" style={{ margin: "0 16px", borderRadius: 18, padding: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <p style={{ ...sectionLabel, margin: 0 }}>{L("Боксын академи", "복싱 아카데미", "Boxing Academy")}</p>
        {!loading && <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{done}/{ACADEMY_LESSONS.length}</span>}
      </div>
      <div style={{ marginTop: 10, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ width: `${(done / ACADEMY_LESSONS.length) * 100}%`, height: "100%", background: "#F5C451", borderRadius: 3 }} />
      </div>

      {next ? (
        <button type="button" onClick={() => go(next)}
          style={{ marginTop: 12, width: "100%", display: "flex", alignItems: "center", gap: 12, minHeight: 56, padding: "10px 14px", borderRadius: 14, border: `1px solid ${next.accentColor || "#F5C451"}55`, background: `${next.accentColor || "#F5C451"}14`, color: "#fff", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
          <span aria-hidden="true" style={{ fontSize: 24 }}>{next.emoji}</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.65)" }}>
              {done === 0 ? L("Эхний хичээл", "첫 수업", "First lesson") : L("Дараагийн хичээл", "다음 수업", "Next lesson")} · {ACADEMY_LESSONS.indexOf(next) + 1}
            </span>
            <span style={{ display: "block", fontSize: 16, fontWeight: 800, marginTop: 2 }}>{title(next)}</span>
          </span>
          <span style={{ fontSize: 14, fontWeight: 800, color: next.accentColor || "#F5C451" }}>{L("Эхлэх →", "시작 →", "Start →")}</span>
        </button>
      ) : (
        <p style={{ margin: "12px 0 0", fontSize: 14, color: "#A7F3D0" }}>{L("Бүх хичээл дууссан. Дуртайгаа давтаарай.", "모든 수업 완료! 원하는 수업을 반복하세요.", "All lessons done — repeat any you like.")}</p>
      )}

      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        style={{ marginTop: 10, minHeight: 40, background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
        {open ? L("Хураах", "접기", "Hide") : L("Бүх хичээл", "모든 수업", "All lessons")} {open ? "▴" : "▾"}
      </button>
      {open && (
        <ol style={{ listStyle: "none", margin: "4px 0 0", padding: 0 }}>
          {ACADEMY_LESSONS.map((l, i) => {
            const isDone = !!lessonProgress?.[l.id]?.completed;
            return (
              <li key={l.id}>
                <button type="button" onClick={() => go(l)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, minHeight: 44, padding: "6px 0", background: "none", border: "none", borderTop: "1px solid rgba(255,255,255,0.06)", color: "#fff", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                  <span style={{ width: 24, fontSize: 13, color: "rgba(255,255,255,0.6)", fontVariantNumeric: "tabular-nums" }}>{i + 1}</span>
                  <span aria-hidden="true">{l.emoji}</span>
                  <span style={{ flex: 1, fontSize: 14 }}>{title(l)}</span>
                  {isDone && <span aria-label={L("Дууссан", "완료", "Done")} style={{ color: "#34D399", fontWeight: 900 }}>✓</span>}
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
