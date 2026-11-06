"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FIGHTERS } from "@/lib/fighters";
import { FIGHTER_TECHNIQUES } from "@/lib/fighterTechniques";
import { GOLD } from "@/lib/tokens";
import { loc } from "@/lib/loc";

const DIFF_COLOR = {
  beginner:     "#10B981",
  intermediate: "#F59E0B",
  advanced:     "#F87171",
};

const DIFF_LABEL = {
  beginner:     { mn: "Эхлэгч", ko: "초급", en: "Beginner" },
  intermediate: { mn: "Дунд",   ko: "중급", en: "Intermediate" },
  advanced:     { mn: "Ахисан", ko: "고급", en: "Advanced" },
};

export default function TechniquePicker({ onSelect, locale }) {
  const [open, setOpen] = useState(false);
  const [selectedFighter, setSelectedFighter] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fighter = selectedFighter ? FIGHTERS.find((f) => f.id === selectedFighter) : null;
  const techniques = selectedFighter ? (FIGHTER_TECHNIQUES[selectedFighter] || []) : [];


  const sheet = open && mounted && createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 290,
          background: "rgba(0,0,0,0.65)",
        }}
      />
      {/* Sheet */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 291,
        background: "#0f0c0d",
        borderRadius: "20px 20px 0 0",
        border: "1px solid rgba(255,255,255,0.09)",
        borderBottom: "none",
        maxHeight: "65vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Handle + header */}
        <div style={{
          padding: "12px 16px 10px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 4, borderRadius: 2,
            background: "rgba(255,255,255,0.18)", margin: "0 auto 12px",
          }} />
          <div style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>
            {loc(locale, "Техник сонгох", "기술 선택", "Pick a technique")}
          </div>
          <div style={{ marginTop: 2, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
            {loc(locale, "Боксчноо сонгоод түүний техникээр раунд хий", "파이터를 고르고 그 기술로 라운드하세요", "Choose a fighter, then do a round on their technique")}
          </div>
        </div>

        {/* Fighter chips */}
        <div style={{
          display: "flex",
          gap: 7,
          padding: "10px 14px",
          overflowX: "auto",
          flexShrink: 0,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          {FIGHTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedFighter(selectedFighter === f.id ? null : f.id)}
              style={{
                flexShrink: 0,
                padding: "8px 14px",
                fontFamily: "inherit",
                borderRadius: 999,
                border: `1px solid ${selectedFighter === f.id ? f.accent : "rgba(255,255,255,0.12)"}`,
                background: selectedFighter === f.id ? `${f.accent}18` : "transparent",
                color: selectedFighter === f.id ? f.accent : "rgba(255,255,255,0.55)",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {selectedFighter === f.id && (
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: f.accent, flexShrink: 0 }} />
              )}
              {f.name.split(" ").slice(-1)[0]}
            </button>
          ))}
        </div>

        {/* Technique list */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: fighter && techniques.length > 0 ? "8px 14px" : "0",
          paddingBottom: `calc(${fighter && techniques.length > 0 ? "16px" : "0px"} + env(safe-area-inset-bottom))`,
        }}>
          {fighter && techniques.length > 0 ? (
            <>
              <div style={{
                fontSize: 13, fontWeight: 600,
                color: fighter.accent,
                padding: "8px 0 10px",
              }}>
                {fighter.name} · {techniques.length} {loc(locale, "техник", "기술", "techniques")}
              </div>
              {techniques.map((lesson, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onSelect({ fighter, lesson });
                    setOpen(false);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "13px 14px",
                    marginBottom: i < techniques.length - 1 ? 8 : 0,
                    borderRadius: 14,
                    fontFamily: "inherit",
                    border: "1px solid rgba(255,255,255,0.07)",
                    background: "rgba(255,255,255,0.03)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#fff", flex: 1 }}>
                    {lesson.title}
                  </span>
                  <span style={{
                    fontSize: 12, fontWeight: 600,
                    color: DIFF_COLOR[lesson.difficulty] || GOLD,
                    background: `${DIFF_COLOR[lesson.difficulty] || GOLD}1f`,
                    borderRadius: 999,
                    padding: "3px 9px",
                    flexShrink: 0,
                  }}>
                    {DIFF_LABEL[lesson.difficulty]?.[locale] || DIFF_LABEL[lesson.difficulty]?.en || lesson.difficulty}
                  </span>
                </button>
              ))}
            </>
          ) : (
            <div style={{
              padding: "24px 0",
              textAlign: "center",
              color: "rgba(255,255,255,0.45)",
              fontSize: 14,
              fontWeight: 500,
            }}>
              {loc(locale, "Дээрээс боксчноо сонгоно уу", "위에서 파이터를 선택하세요", "Pick a fighter above")}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );

  return (
    <>
      {sheet}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 14,
          padding: "14px 16px", borderRadius: 22, cursor: "pointer", textAlign: "left", fontFamily: "inherit",
          border: `1px solid ${open ? "rgba(245,196,81,0.4)" : "rgba(255,255,255,0.10)"}`,
          background: open ? "rgba(245,196,81,0.07)" : "rgba(255,255,255,0.04)",
          color: "#fff",
        }}
      >
        <span aria-hidden="true" style={{ width: 42, height: 42, borderRadius: 14, flexShrink: 0, display: "grid", placeItems: "center", fontSize: 20, background: "rgba(245,196,81,0.12)" }}>⚡</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 15.5, fontWeight: 600 }}>{loc(locale, "Техник сонгож дасгал хийх", "기술로 훈련하기", "Train a technique")}</span>
          <span style={{ display: "block", marginTop: 2, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{loc(locale, "Алдартай боксчдын техникээр раунд хий", "유명 파이터의 기술로 라운드", "A round on a famous fighter's technique")}</span>
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
    </>
  );
}
