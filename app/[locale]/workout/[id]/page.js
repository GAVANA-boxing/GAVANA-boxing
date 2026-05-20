"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { WORKOUTS } from "@/lib/data";
import { getLocale, translate } from "@/lib/i18n";
import { useAuth } from "@/lib/AuthContext";
import BottomNav from "@/components/BottomNav";
import { RED, GOLD, redAlpha } from "@/lib/tokens";

export default function WorkoutDetail() {
  const { id, locale: localeParam } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const locale = getLocale(localeParam);
  const t = (key) => translate(locale, key);

  const workout = WORKOUTS.find((w) => w.id === Number(id));
  const [done, setDone] = useState({});

  if (!workout) {
    return (
      <div style={{ minHeight: "100vh", background: "#070707", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "#fff" }}>
        <p style={{ fontSize: 40 }}>🥊</p>
        <p style={{ fontSize: 15, fontWeight: 800 }}>Workout not found</p>
        <button type="button" onClick={() => router.back()} style={{ padding: "10px 20px", borderRadius: 12, border: "none", background: RED, color: "#fff", fontWeight: 800, cursor: "pointer" }}>
          Go back
        </button>
        <BottomNav router={router} user={user} currentLocale={locale} />
      </div>
    );
  }

  const exercises = Array.isArray(workout.exercises)
    ? workout.exercises.map((ex) => typeof ex === "string" ? { name: ex, details: "" } : ex)
    : [];

  const completedCount = Object.values(done).filter(Boolean).length;
  const totalCount = exercises.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) : 0;
  const allDone = totalCount > 0 && completedCount === totalCount;

  return (
    <div style={s.page}>
      {/* Ambient glow */}
      <div style={s.ambientGlow} />

      {/* Header */}
      <div style={s.header}>
        <button type="button" onClick={() => router.back()} style={s.backBtn} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div>
          <p style={s.kicker}>GAVANA · {(workout.level || "workout").toUpperCase()}</p>
          <h1 style={s.title}>{workout.title}</h1>
        </div>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div style={s.progressWrap}>
          <div style={s.progressTrack}>
            <div style={{ ...s.progressFill, width: `${progress * 100}%`, background: allDone ? "#34D399" : RED }} />
          </div>
          <span style={s.progressLabel}>
            {completedCount}/{totalCount}
          </span>
        </div>
      )}

      {/* Exercise list */}
      <div style={s.list}>
        {exercises.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
            No exercises listed
          </div>
        ) : (
          exercises.map((ex, i) => {
            const checked = !!done[i];
            return (
              <button
                key={i}
                type="button"
                onClick={() => setDone((prev) => ({ ...prev, [i]: !prev[i] }))}
                style={{
                  ...s.exerciseRow,
                  borderLeft: `3px solid ${checked ? "#34D399" : redAlpha(0.4)}`,
                  background: checked ? "rgba(52,211,153,0.06)" : "rgba(255,255,255,0.025)",
                  opacity: checked ? 0.75 : 1,
                }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  border: `2px solid ${checked ? "#34D399" : "rgba(255,255,255,0.18)"}`,
                  background: checked ? "#34D399" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 200ms ease",
                }}>
                  {checked && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: checked ? "rgba(255,255,255,0.45)" : "#fff", textDecoration: checked ? "line-through" : "none" }}>
                    {ex.name}
                  </p>
                  {ex.details && (
                    <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{ex.details}</p>
                  )}
                </div>
                {ex.duration && (
                  <span style={{ fontSize: 11, fontWeight: 800, color: GOLD, flexShrink: 0, fontFamily: "var(--font-condensed)" }}>
                    {ex.duration}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Done state */}
      {allDone && (
        <div style={s.doneCard}>
          <p style={{ fontSize: 36, margin: "0 0 8px" }}>🏆</p>
          <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 900, color: "#34D399" }}>
            {locale === "mn" ? "Гайхалтай! Дууслаа!" : locale === "ko" ? "완료했습니다!" : "Workout Complete!"}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            {locale === "mn" ? `${totalCount} дасгал гүйцэтгэлээ` : locale === "ko" ? `${totalCount}개 운동 완료` : `${totalCount} exercises finished`}
          </p>
        </div>
      )}

      <div style={{ height: "calc(80px + env(safe-area-inset-bottom))" }} />
      <BottomNav router={router} user={user} currentLocale={locale} />
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "#070707",
    color: "#fff",
    position: "relative",
    paddingBottom: 80,
  },
  ambientGlow: {
    position: "fixed",
    top: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "80%",
    height: 260,
    background: `radial-gradient(ellipse at top, ${redAlpha(0.08)} 0%, transparent 70%)`,
    pointerEvents: "none",
    zIndex: 0,
  },
  header: {
    padding: "calc(36px + env(safe-area-inset-top)) 20px 20px",
    position: "relative",
    zIndex: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.055)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    color: "#fff",
    cursor: "pointer",
    padding: 0,
    marginBottom: 16,
  },
  kicker: {
    margin: "0 0 6px",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: RED,
    fontFamily: "var(--font-condensed)",
  },
  title: {
    margin: 0,
    fontSize: "clamp(28px, 9vw, 44px)",
    fontWeight: 900,
    lineHeight: 1,
    fontFamily: "var(--font-display)",
  },
  progressWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 20px 16px",
    position: "relative",
    zIndex: 1,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 400ms cubic-bezier(0.16,1,0.3,1)",
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: 800,
    color: "rgba(255,255,255,0.4)",
    fontFamily: "var(--font-condensed)",
    flexShrink: 0,
  },
  list: {
    padding: "0 16px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    position: "relative",
    zIndex: 1,
  },
  exerciseRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 16px",
    borderRadius: "3px 14px 14px 3px",
    cursor: "pointer",
    border: "none",
    color: "#fff",
    transition: "background 200ms ease, opacity 200ms ease",
    width: "100%",
    textAlign: "left",
  },
  doneCard: {
    margin: "20px 16px",
    padding: "28px 20px",
    borderRadius: 18,
    border: "1px solid rgba(52,211,153,0.25)",
    background: "rgba(52,211,153,0.06)",
    textAlign: "center",
    position: "relative",
    zIndex: 1,
  },
};
