"use client";

import { RADIUS, GOLD, whiteAlpha } from "@/lib/tokens";
import { ARCH_TRAINING_COLORS } from "@/lib/archetypeTraining";
import { computeFighterDNA } from "@/lib/fighterDNA";

const TL_L = {
  en: { title: "DNA Confidence · Timeline", sessionStart: "S1", archSwitch: "Archetype shift", current: "Current" },
  mn: { title: "ДНХ найдвартай байдал · Хэлхээ", sessionStart: "T1", archSwitch: "Archetype өөрчлөлт", current: "Одоо" },
  ko: { title: "DNA 신뢰도 · 타임라인", sessionStart: "S1", archSwitch: "아키타입 전환", current: "현재" },
};

const ARCH_NAMES = {
  en: { pressure: "Pressure", outboxer: "Outboxer", counter: "Counter", explosive: "Explosive", technician: "Technician" },
  mn: { pressure: "Дарамт", outboxer: "Аутбоксер", counter: "Контр", explosive: "Тэсрэлт", technician: "Техникч" },
  ko: { pressure: "프레셔", outboxer: "아웃복서", counter: "카운터", explosive: "폭발적", technician: "테크니션" },
};

export default function DNATimelineCard({ sessions, locale }) {
  const L = TL_L[locale] || TL_L.en;
  const names = ARCH_NAMES[locale] || ARCH_NAMES.en;

  const sorted = [...sessions].sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
  if (sorted.length < 3) return null;

  // Sample up to 15 checkpoints
  const MAX = 15;
  const step = Math.max(1, Math.ceil(sorted.length / MAX));
  const indices = [];
  for (let i = step - 1; i < sorted.length; i += step) indices.push(i);
  if (indices[indices.length - 1] !== sorted.length - 1) indices.push(sorted.length - 1);

  const snapshots = indices.map((idx) => {
    const d = computeFighterDNA({ sessions: sorted.slice(0, idx + 1), locale });
    return {
      n: idx + 1,
      conf: d.building ? 0 : Math.round((d.confidence || 0) * 100),
      arch: d.building ? null : d.archetypeKey,
    };
  });

  const last = snapshots[snapshots.length - 1];
  const currentColor = ARCH_TRAINING_COLORS[last?.arch] || GOLD;
  const W = 260, H = 52;

  const pts = snapshots.map((s, i) => {
    const x = snapshots.length < 2 ? W / 2 : (i / (snapshots.length - 1)) * W;
    const y = H - (s.conf / 100) * H;
    return [x, y];
  });
  const polyline = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const area = [`0,${H}`, ...pts.map(([x, y]) => `${x},${y}`), `${W},${H}`].join(" ");

  // Detect archetype transitions
  const transitions = [];
  let prev = null;
  snapshots.forEach((s, i) => {
    if (s.arch && s.arch !== prev) { transitions.push(i); prev = s.arch; }
  });

  return (
    <div style={{
      borderRadius: RADIUS.lg, overflow: "hidden",
      border: `1px solid ${whiteAlpha(0.07)}`,
      background: whiteAlpha(0.022),
      marginBottom: 8,
    }}>
      <div style={{ height: 2, background: `linear-gradient(90deg, ${currentColor}88, transparent)` }} />
      <div style={{ padding: "14px 16px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 2, color: whiteAlpha(0.28), textTransform: "uppercase" }}>
            {L.title}
          </span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: currentColor, fontFamily: "monospace" }}>
              {last.conf}%
            </span>
            <span style={{ fontSize: 8.5, fontWeight: 700, color: whiteAlpha(0.3), textTransform: "uppercase" }}>
              {L.current}
            </span>
          </div>
        </div>

        {/* SVG Sparkline */}
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: "block", overflow: "visible" }}>
          <defs>
            <linearGradient id="tl-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={currentColor} stopOpacity={0.18} />
              <stop offset="100%" stopColor={currentColor} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          {/* Subtle grid lines at 25/50/75% */}
          {[25, 50, 75].map((pct) => (
            <line key={pct} x1={0} x2={W} y1={H - (pct / 100) * H} y2={H - (pct / 100) * H}
              stroke="rgba(255,255,255,0.04)" strokeWidth={1} strokeDasharray="3 4" />
          ))}
          {/* Area fill */}
          <polyline points={area} fill="url(#tl-fill)" stroke="none" />
          {/* Confidence line */}
          <polyline points={polyline} fill="none" stroke={currentColor} strokeWidth={1.8}
            strokeLinejoin="round" strokeLinecap="round" opacity={0.75} />
          {/* Archetype transition dots */}
          {transitions.map((i) => {
            const [x, y] = pts[i];
            const c = ARCH_TRAINING_COLORS[snapshots[i].arch] || GOLD;
            return <circle key={i} cx={x} cy={y} r={3.5} fill={c} stroke="rgba(0,0,0,0.5)" strokeWidth={1} />;
          })}
          {/* Current (last) dot */}
          <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]}
            r={4.5} fill={currentColor} stroke="rgba(0,0,0,0.6)" strokeWidth={1.5} />
        </svg>

        {/* X-axis labels */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 8, fontWeight: 700, color: whiteAlpha(0.2) }}>{L.sessionStart}</span>
          <span style={{ fontSize: 8, fontWeight: 700, color: whiteAlpha(0.2) }}>S{sorted.length}</span>
        </div>

        {/* Archetype shift legend — only show if changed */}
        {transitions.length > 1 && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${whiteAlpha(0.05)}` }}>
            <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.5, color: whiteAlpha(0.2), textTransform: "uppercase", marginBottom: 6 }}>
              {L.archSwitch}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {transitions.map((i) => {
                const arch = snapshots[i].arch;
                const color = ARCH_TRAINING_COLORS[arch] || GOLD;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 9, fontWeight: 800, color: whiteAlpha(0.45) }}>
                      {names[arch] || arch}
                    </span>
                    <span style={{ fontSize: 8, color: whiteAlpha(0.2), fontWeight: 700 }}>
                      @S{snapshots[i].n}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
