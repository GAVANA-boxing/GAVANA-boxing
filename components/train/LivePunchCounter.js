"use client";
import { useEffect, useRef, useState } from "react";

const TYPE_COLOR = { jab: "#60A5FA", cross: "#F87171", hook: "#F59E0B" };
const TYPE_LABEL = { jab: "JAB", cross: "CROSS", hook: "HOOK" };

function speedLabel(snapVel) {
  if (snapVel == null) return null;
  if (snapVel > 0.35) return "FAST";
  if (snapVel > 0.20) return "GOOD";
  return null;
}

const COMBO_TYPE_COLOR = { jab: "#60A5FA", cross: "#F87171", hook: "#F59E0B" };
const COMBO_TYPE_NUM   = { jab: "1", cross: "2", hook: "3", uppercut: "4" };

export default function LivePunchCounter({ getDebugInfo, isActive, punchTarget }) {
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
  const speed      = speedLabel(lastSnap);
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
          GOAL ✓
        </div>
      )}

      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "7px 18px 7px 14px", borderRadius: 28,
        background: goalDone ? "rgba(52,211,153,0.12)" : "rgba(0,0,0,0.65)",
        backdropFilter: "blur(10px)",
        border: `1px solid ${goalDone ? "rgba(52,211,153,0.35)" : "rgba(255,255,255,0.1)"}`,
        transition: "background 0.4s, border-color 0.4s",
      }}>

        {/* Count + optional target */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
          <span
            key={`cnt-${flash}`}
            style={{
              fontSize: 28, fontWeight: 900,
              color: goalDone ? "#34D399" : "#fff",
              lineHeight: 1,
              animation: flash > 0 ? "punchPop 0.25s ease-out" : "none",
            }}
          >
            {count}
          </span>
          {hasTarget && (
            <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.3)" }}>
              /{punchTarget}
            </span>
          )}
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700, marginLeft: 2 }}>
            HIT
          </span>
        </div>

        {/* Progress bar (when target set) */}
        {hasTarget && (
          <div style={{ width: 48, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 2,
              width: `${pct * 100}%`,
              background: goalDone ? "#34D399" : "#F59E0B",
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
            <span style={{ fontSize: 13, fontWeight: 900, color: typeColor, letterSpacing: 0.5 }}>
              {TYPE_LABEL[lastType]}
            </span>
            {speed && (
              <span style={{
                fontSize: 9, fontWeight: 900, letterSpacing: 1,
                color: speed === "FAST" ? "#34D399" : "rgba(255,255,255,0.45)",
              }}>
                {speed}
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
            display: "flex", alignItems: "center", gap: 4,
            padding: "4px 14px",
            borderRadius: 20,
            background: "rgba(0,0,0,0.70)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.12)",
            animation: "comboSlideIn 0.18s ease-out",
          }}
        >
          {liveCombo.types.map((t, i) => (
            <span
              key={i}
              style={{
                fontSize: 17, fontWeight: 900,
                color: COMBO_TYPE_COLOR[t] || "#fff",
                lineHeight: 1,
                opacity: i === liveCombo.types.length - 1 ? 1 : 0.65,
              }}
            >
              {COMBO_TYPE_NUM[t] ?? "?"}
            </span>
          ))}
          {liveCombo.name && (
            <span style={{
              fontSize: 8, fontWeight: 900, letterSpacing: 1.2,
              color: "rgba(255,255,255,0.4)",
              marginLeft: 4, textTransform: "uppercase",
            }}>
              {liveCombo.name}
            </span>
          )}
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
