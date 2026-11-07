"use client";
import { useEffect, useRef, useState } from "react";
import { loc } from "@/lib/loc";

// Same punch colours as the result's punch-mix bar (ResultHeader).
const TYPE_COLOR = { jab: "#60A5FA", cross: "#FF3B30", hook: "#F5C451", uppercut: "#A78BFA" };
const TYPE_LABEL = { jab: "Jab", cross: "Cross", hook: "Hook", uppercut: "Uppercut" };

export default function LivePunchCounter({ getDebugInfo, isActive, punchTarget, locale = "en" }) {
  const [count, setCount]         = useState(0);
  const [lastType, setLastType]   = useState(null);
  const [lastSnap, setLastSnap]   = useState(null);
  const [flash, setFlash]         = useState(0);
  const [goalFlash, setGoalFlash] = useState(false);
  const [liveCombo, setLiveCombo] = useState(null);
  const [comboFlash, setComboFlash] = useState(0);
  const prevCount                 = useRef(0);
  const prevComboLen              = useRef(0);
  const goalFired                 = useRef(false);

  useEffect(() => {
    if (!isActive) {
      setCount(0); setLastType(null); setLastSnap(null);
      setFlash(0); setGoalFlash(false); setLiveCombo(null);
      prevCount.current = 0; prevComboLen.current = 0; goalFired.current = false;
      return;
    }
    const id = setInterval(() => {
      const info = getDebugInfo?.();
      if (!info) return;
      const c = info.punchCount ?? 0;
      if (c !== prevCount.current) {
        prevCount.current = c;
        setCount(c);
        setLastType(info.lastPunchType ?? null);
        setLastSnap(info.lastSnapVelocity ?? null);
        setFlash((f) => f + 1);

        if (punchTarget && c >= punchTarget && !goalFired.current) {
          goalFired.current = true;
          setGoalFlash(true);
          setTimeout(() => setGoalFlash(false), 1800);
        }
      }

      // Update live combo display
      const combo = info.liveCombo ?? null;
      const comboLen = combo?.length ?? 0;
      setLiveCombo(combo);
      if (comboLen > prevComboLen.current) {
        setComboFlash((f) => f + 1);
      }
      prevComboLen.current = comboLen;
    }, 150);
    return () => clearInterval(id);
  }, [getDebugInfo, isActive, punchTarget]);

  if (!isActive) return null;

  const typeColor  = TYPE_COLOR[lastType] || "#fff";
  const fast       = lastSnap != null && lastSnap > 0.35;
  const hasTarget  = punchTarget != null;
  const goalDone   = hasTarget && count >= punchTarget;
  const pct        = hasTarget ? Math.min(1, count / punchTarget) : null;
  const showCombo  = liveCombo && liveCombo.length >= 2;

  return (
    <div style={{
      position: "absolute", bottom: 96, left: 0, right: 0,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
      pointerEvents: "none", zIndex: 20,
    }}>
      {/* Goal celebration */}
      {goalFlash && (
        <div style={{
          position: "absolute", bottom: 52,
          fontSize: 13, fontWeight: 900, letterSpacing: 1.5,
          color: "#34D399",
          animation: "goalPop 1.8s ease-out forwards",
        }}>
          {loc(locale, "Зорилго биеллээ ✓", "목표 달성 ✓", "Goal reached ✓")}
        </div>
      )}

      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "8px 18px 8px 16px", borderRadius: 999,
        background: goalDone ? "rgba(52,211,153,0.14)" : "rgba(10,10,12,0.72)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        border: `1px solid ${goalDone ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.1)"}`,
        transition: "background 0.4s, border-color 0.4s",
      }}>

        {/* Count + optional target */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
          <span
            key={`cnt-${flash}`}
            style={{
              fontSize: 34, fontWeight: 700, fontFamily: "var(--font-display)",
              color: goalDone ? "#34D399" : "#fff",
              lineHeight: 1,
              animation: flash > 0 ? "punchPop 0.25s ease-out" : "none",
            }}
          >
            {count}
          </span>
          {hasTarget && (
            <span style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>
              /{punchTarget}
            </span>
          )}
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, marginLeft: 4 }}>
            {loc(locale, "цохилт", "펀치", "punches")}
          </span>
        </div>

        {/* Progress bar (when target set) */}
        {hasTarget && (
          <div style={{ width: 48, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 2,
              width: `${pct * 100}%`,
              background: goalDone ? "#34D399" : "linear-gradient(90deg, #FF3B30, #F5C451)",
              transition: "width 0.2s",
            }} />
          </div>
        )}

        {/* Divider */}
        {lastType && (
          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.12)" }} />
        )}

        {/* Last punch type + speed */}
        {lastType && (
          <div
            key={`type-${flash}`}
            style={{ display: "flex", alignItems: "center", gap: 5, animation: "punchFadeIn 0.2s ease-out" }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: typeColor, boxShadow: `0 0 10px ${typeColor}` }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
              {TYPE_LABEL[lastType] || lastType}
            </span>
            {fast && (
              <span style={{ fontSize: 11, fontWeight: 700, color: "#34D399" }}>
                {loc(locale, "хурдан", "빠름", "fast")}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Live combo sequence — shown when 2+ punches in buffer */}
      {showCombo && (
        <div
          key={`combo-${comboFlash}`}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 14px",
            borderRadius: 20,
            background: "rgba(0,0,0,0.70)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.12)",
            animation: "comboSlideIn 0.18s ease-out",
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: "#F5C451", marginRight: 4 }}>
            {loc(locale, "Комбо", "콤보", "Combo")}
          </span>
          {liveCombo.types.slice(-4).map((t, i, arr) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600, color: "#fff", opacity: i === arr.length - 1 ? 1 : 0.6 }}>
              {i > 0 && <span style={{ color: "rgba(255,255,255,0.55)" }}>·</span>}
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: TYPE_COLOR[t] || "#fff" }} />
              {TYPE_LABEL[t] || t}
            </span>
          ))}
        </div>
      )}

      <style>{`
        @keyframes punchPop {
          0%   { transform: scale(1.4); }
          100% { transform: scale(1); }
        }
        @keyframes punchFadeIn {
          0%   { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes goalPop {
          0%   { opacity: 0; transform: translateY(0) scale(0.8); }
          20%  { opacity: 1; transform: translateY(-8px) scale(1.1); }
          70%  { opacity: 1; transform: translateY(-10px) scale(1); }
          100% { opacity: 0; transform: translateY(-16px) scale(0.95); }
        }
        @keyframes comboSlideIn {
          0%   { opacity: 0; transform: translateY(6px) scale(0.92); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
