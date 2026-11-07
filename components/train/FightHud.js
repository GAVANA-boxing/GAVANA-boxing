"use client";

import { useEffect, useRef, useState } from "react";
import { loc } from "@/lib/loc";
import { roundClock, createPunchTicks, createGuardWatch, PUNCH_TYPES } from "@/lib/fightHud";

// Fight HUD — drawn over the stage while a round runs: a round-clock ring that
// turns red and pulses in the last seconds, a strip of the last punches by
// type, and a guard-down warning. Reads the same live data as the punch
// counter (getDebugInfo); it never changes scoring.

// Same punch colours as LivePunchCounter / the result's punch mix.
const TYPE_COLOR = { jab: "#60A5FA", cross: "#FF3B30", hook: "#F5C451", uppercut: "#A78BFA" };
const TYPE_SHORT = {
  jab: ["Ж", "잽", "J"],
  cross: ["К", "크", "C"],
  hook: ["Х", "훅", "H"],
  uppercut: ["А", "어", "U"],
};
const TYPE_NAME = {
  jab: ["Жэб", "잽", "Jab"],
  cross: ["Кросс", "크로스", "Cross"],
  hook: ["Хук", "훅", "Hook"],
  uppercut: ["Апперкот", "어퍼컷", "Uppercut"],
};
const RING = 60;
const STROKE = 5;
const R = (RING - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

export default function FightHud({ getDebugInfo, isActive, secondsLeft, totalSeconds, locale = "en", pollMs = 150 }) {
  const L = (mn, ko, en) => loc(locale, mn, ko, en);
  const ticksRef = useRef(null);
  const guardRef = useRef(null);
  const [ticks, setTicks] = useState([]);
  const [counts, setCounts] = useState({});
  const [guardWarn, setGuardWarn] = useState(false);

  useEffect(() => {
    if (!isActive) { setTicks([]); setCounts({}); setGuardWarn(false); return undefined; }
    ticksRef.current = createPunchTicks({ limit: 8 });
    guardRef.current = createGuardWatch();
    const poll = () => {
      const info = getDebugInfo?.();
      if (!info) return;
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      if (ticksRef.current.update(info.punchCount, info.lastPunchType, now)) {
        guardRef.current.punched(now);
        setTicks(ticksRef.current.ticks());
        setCounts(ticksRef.current.counts());
      }
      setGuardWarn(guardRef.current.push(now, info.latestMetrics?.guardHeight?.status ?? null));
    };
    poll();
    const id = setInterval(poll, pollMs);
    return () => clearInterval(id);
  }, [getDebugInfo, isActive, pollMs]);

  if (!isActive) return null;
  const clock = roundClock(secondsLeft, totalSeconds);
  const ringColor = clock.final ? "#FF3B30" : "#fff";

  return (
    <div aria-hidden="true" data-testid="fight-hud" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 19 }}>
      {/* Last seconds: the stage edge pulses red. */}
      {clock.final && <div key={`edge-${clock.remaining}`} className="fight-edge-pulse" style={{ position: "absolute", inset: 0, borderRadius: "inherit" }} />}

      {/* Round clock ring */}
      <div style={{ position: "absolute", top: 62, left: 12, width: RING, height: RING }}>
        <svg width={RING} height={RING} viewBox={`0 0 ${RING} ${RING}`} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
          <circle cx={RING / 2} cy={RING / 2} r={R} fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.14)" strokeWidth={STROKE} />
          <circle
            cx={RING / 2} cy={RING / 2} r={R} fill="none"
            stroke={ringColor} strokeWidth={STROKE} strokeLinecap="round"
            strokeDasharray={CIRC} strokeDashoffset={CIRC * clock.elapsedPct}
            style={{ transition: "stroke-dashoffset 0.25s linear, stroke 0.3s" }}
          />
        </svg>
        <div
          key={clock.final ? `n-${clock.remaining}` : "n"}
          className={clock.final ? "fight-tick-pop" : undefined}
          style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: ringColor, fontSize: clock.label.length > 2 ? 15 : 20, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}
        >
          {clock.label}
        </div>
      </div>
      {clock.final && (
        <div style={{ position: "absolute", top: 128, left: 12, fontSize: 11, fontWeight: 900, letterSpacing: 1, color: "#FF6B6B", textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>
          {L("СҮҮЛИЙН СЕКУНД", "마지막 몇 초", "FINAL SECONDS")}
        </div>
      )}

      {/* Punch tick strip: newest on the right */}
      {ticks.length > 0 && (
        <div data-testid="fight-hud-ticks" style={{ position: "absolute", top: clock.final ? 146 : 132, left: 12, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", gap: 3 }}>
            {ticks.map((tk, i) => (
              <span key={tk.n} className={i === ticks.length - 1 ? "fight-tick-pop" : undefined} style={{
                width: 20, height: 20, borderRadius: 6, display: "grid", placeItems: "center",
                background: `${TYPE_COLOR[tk.type]}33`, border: `1px solid ${TYPE_COLOR[tk.type]}`,
                color: "#fff", fontSize: 11, fontWeight: 900,
                opacity: 0.45 + (0.55 * (i + 1)) / ticks.length,
              }}>
                {loc(locale, ...TYPE_SHORT[tk.type])}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", maxWidth: 200, columnGap: 8, rowGap: 2, fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.85)", textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>
            {PUNCH_TYPES.filter((t) => counts[t] > 0).map((t) => (
              <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: TYPE_COLOR[t] }} />
                {loc(locale, ...TYPE_NAME[t])} {counts[t]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Guard-down warning */}
      {guardWarn && (
        <div data-testid="fight-hud-guard" className="fight-guard-shake" style={{
          position: "absolute", top: "46%", left: "50%", transform: "translateX(-50%)",
          padding: "8px 16px", borderRadius: 999, whiteSpace: "nowrap",
          background: "rgba(255,59,48,0.9)", border: "1px solid #FF6B6B",
          boxShadow: "0 0 24px rgba(255,59,48,0.55)",
          color: "#fff", fontSize: 15, fontWeight: 900, letterSpacing: 0.5,
        }}>
          {L("Гараа өргө — эрүүгээ хамгаал!", "가드 올려 — 턱을 지켜!", "Hands up — guard your chin!")}
        </div>
      )}

      <style>{`
        .fight-edge-pulse { animation: fightEdge 1s ease-out; box-shadow: inset 0 0 0 3px rgba(255,59,48,0.9), inset 0 0 40px rgba(255,59,48,0.45); opacity: 0; }
        @keyframes fightEdge { 0% { opacity: 1; } 100% { opacity: 0; } }
        .fight-tick-pop { animation: fightPop 0.28s ease-out; }
        @keyframes fightPop { 0% { transform: scale(1.35); } 100% { transform: scale(1); } }
        .fight-guard-shake { animation: fightShake 0.4s ease-in-out; }
        @keyframes fightShake { 0%,100% { margin-left: 0; } 25% { margin-left: -6px; } 75% { margin-left: 6px; } }
        @media (prefers-reduced-motion: reduce) {
          .fight-edge-pulse, .fight-tick-pop, .fight-guard-shake { animation: none; }
          .fight-edge-pulse { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
