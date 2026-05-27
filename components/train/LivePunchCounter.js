"use client";
import { useEffect, useRef, useState } from "react";

const TYPE_COLOR = { jab: "#60A5FA", cross: "#F87171", hook: "#F59E0B" };
const TYPE_LABEL = { jab: "JAB", cross: "CROSS", hook: "HOOK" };

const SPEED_LABEL = (snapVel) => {
  if (snapVel == null) return null;
  if (snapVel > 0.35) return "FAST";
  if (snapVel > 0.20) return "GOOD";
  return null;
};

export default function LivePunchCounter({ getDebugInfo, isActive }) {
  const [count, setCount]       = useState(0);
  const [lastType, setLastType] = useState(null);
  const [lastSnap, setLastSnap] = useState(null);
  const [flash, setFlash]       = useState(0); // incremented on each new punch to trigger animation
  const prevCount               = useRef(0);

  useEffect(() => {
    if (!isActive) {
      setCount(0);
      setLastType(null);
      setLastSnap(null);
      prevCount.current = 0;
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
      }
    }, 150);
    return () => clearInterval(id);
  }, [getDebugInfo, isActive]);

  if (!isActive) return null;

  const typeColor = TYPE_COLOR[lastType] || "#fff";
  const speedLabel = SPEED_LABEL(lastSnap);

  return (
    <div style={{
      position: "absolute", bottom: 64, left: 0, right: 0,
      display: "flex", justifyContent: "center",
      pointerEvents: "none", zIndex: 20,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "7px 18px 7px 14px", borderRadius: 28,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}>
        {/* Count */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
          <span
            key={`cnt-${flash}`}
            style={{
              fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1,
              animation: flash > 0 ? "punchPop 0.25s ease-out" : "none",
            }}
          >
            {count}
          </span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>
            HIT
          </span>
        </div>

        {/* Divider */}
        {lastType && (
          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.12)" }} />
        )}

        {/* Last punch type + speed */}
        {lastType && (
          <div
            key={`type-${flash}`}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              animation: "punchFadeIn 0.2s ease-out",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 900, color: typeColor, letterSpacing: 0.5 }}>
              {TYPE_LABEL[lastType]}
            </span>
            {speedLabel && (
              <span style={{
                fontSize: 9, fontWeight: 900, letterSpacing: 1,
                color: speedLabel === "FAST" ? "#34D399" : "rgba(255,255,255,0.45)",
              }}>
                {speedLabel}
              </span>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes punchPop {
          0%   { transform: scale(1.4); color: #fff; }
          100% { transform: scale(1);   color: #fff; }
        }
        @keyframes punchFadeIn {
          0%   { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
