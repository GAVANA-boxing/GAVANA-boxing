"use client";

import { useState } from "react";
import { RED } from "@/lib/tokens";
import { loc, tx } from "@/lib/loc";
import { BRAND, btnPrimary } from "@/components/ui/brand";

// The lesson card on the Train start screen: what to practise in this round. Three cues and one
// Start button; the common mistake and the drill steps sit behind "More" (owner feedback: too
// much text before the round). Never shows a real boxer's name.

const DIFF_COLOR = { beginner: "#10B981", intermediate: "#F59E0B", advanced: "#F87171" };
const DIFF_LABEL = {
  beginner:     ["Анхан", "초급", "Beginner"],
  intermediate: ["Дунд", "중급", "Intermediate"],
  advanced:     ["Ахисан", "고급", "Advanced"],
};
const MAX_CUES = 3;

export default function TrainingFocusCard({ lesson, academyLesson, accent = RED, locale = "en", onStart }) {
  const [more, setMore] = useState(false);
  if (!lesson && !academyLesson) return null;

  const L = (mn, ko, en) => loc(locale, mn, ko, en);
  const isAcademy = !!academyLesson;
  const diffKey = (academyLesson || lesson)?.difficulty || "intermediate";
  const diffColor = DIFF_COLOR[diffKey] || DIFF_COLOR.intermediate;
  const ac = accent || RED;

  // Lesson fields are localized objects { mn, ko, en } in the Academy (lib/lessons/*) and in most
  // fighter-technique fields (lib/fighterTechniques.js), plain strings in a few. tx() turns
  // either into a string — rendering the raw object crashed the whole page.
  const title = tx(isAcademy ? academyLesson.title : lesson?.title, locale);
  const commonMistake = tx(isAcademy ? academyLesson.commonMistake : lesson?.commonMistake, locale);
  const drillSteps = ((isAcademy ? academyLesson.drill?.steps : lesson?.drillSteps) || []).map((s) => tx(s, locale)).filter(Boolean);
  const bodyCue = tx(lesson?.bodyCue, locale);
  // What to keep in mind during the round: the Academy lesson's key cues, or a technique
  // drill's one body cue.
  const cues = (isAcademy ? (academyLesson.keyCues || []).map((c) => tx(c, locale)) : [bodyCue]).filter(Boolean).slice(0, MAX_CUES);
  const hasMore = Boolean(commonMistake) || drillSteps.length > 0;

  return (
    <section data-testid="lesson-card" style={{ borderRadius: 20, border: `1px solid ${ac}40`, background: `linear-gradient(160deg, ${ac}12 0%, rgba(255,255,255,0.02) 100%)`, padding: 16, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: ac, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {isAcademy ? L("Академийн хичээл", "아카데미 수업", "Academy lesson") : L("Техникийн дасгал", "테크닉 드릴", "Technique drill")}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: diffColor, background: `${diffColor}1a`, border: `1px solid ${diffColor}40`, borderRadius: 999, padding: "3px 10px", flexShrink: 0 }}>
          {loc(locale, ...(DIFF_LABEL[diffKey] || DIFF_LABEL.intermediate))}
        </span>
      </div>

      <h2 style={{ margin: "10px 0 0", fontSize: 22, fontWeight: 800, lineHeight: 1.15, color: BRAND.text, overflowWrap: "anywhere" }}>
        {isAcademy && academyLesson.emoji ? <span aria-hidden="true">{academyLesson.emoji} </span> : null}{title}
      </h2>

      {cues.length > 0 && (
        <ol data-testid="lesson-cues" style={{ listStyle: "none", margin: "14px 0 0", padding: 0, display: "grid", gap: 10 }}>
          {cues.map((cue, i) => (
            <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span aria-hidden="true" style={{ width: 24, height: 24, borderRadius: 8, background: `${ac}22`, border: `1px solid ${ac}45`, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 800, color: ac, flexShrink: 0 }}>{i + 1}</span>
              <span style={{ fontSize: 15, lineHeight: 1.45, color: "rgba(255,255,255,0.88)" }}>{cue}</span>
            </li>
          ))}
        </ol>
      )}

      {onStart && (
        <button type="button" data-testid="lesson-start" onClick={onStart} style={{ ...btnPrimary, marginTop: 16, fontFamily: "inherit" }}>
          {L("Раунд эхлэх →", "라운드 시작 →", "Start the round →")}
        </button>
      )}

      {hasMore && (
        <>
          <button type="button" data-testid="lesson-more" aria-expanded={more} onClick={() => setMore((v) => !v)}
            style={{ marginTop: 6, width: "100%", minHeight: 44, background: "none", border: "none", color: BRAND.muted, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            {more ? L("Хураах ▴", "접기 ▴", "Less ▴") : L("Дэлгэрэнгүй ▾", "자세히 ▾", "More ▾")}
          </button>
          {more && (
            <div data-testid="lesson-details" style={{ display: "grid", gap: 14, paddingTop: 4 }}>
              {commonMistake && (
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "#FB923C", marginBottom: 4 }}>{L("Нийтлэг алдаа", "흔한 실수", "Common mistake")}</div>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "rgba(255,255,255,0.75)" }}>{commonMistake}</p>
                </div>
              )}
              {drillSteps.length > 0 && (
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: BRAND.muted, marginBottom: 6 }}>{L("Дасгалын алхам", "드릴 단계", "Drill steps")}</div>
                  <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6, fontSize: 14, lineHeight: 1.5, color: "rgba(255,255,255,0.75)" }}>
                    {drillSteps.map((step, i) => <li key={i}>{step}</li>)}
                  </ol>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
