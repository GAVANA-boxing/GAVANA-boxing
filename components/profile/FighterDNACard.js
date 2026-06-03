"use client";

import { RED, GOLD, RADIUS, whiteAlpha, goldAlpha, redAlpha } from "@/lib/tokens";

const STYLE_COLORS = {
  pressure:   "#FF3B30",
  outboxer:   "#34D399",
  counter:    "#60A5FA",
  explosive:  "#F59E0B",
  technician: "#F5C451",
};

const SECTION_LABELS = {
  en: {
    dna:       "Fighter DNA",
    style:     "Style Mix",
    weapon:    "Best Weapon",
    weakness:  "Focus Area",
    fighters:  "Train Like",
    evolution: "Next Evolution",
    building:  "Building DNA",
    sessions:  (n) => `Train ${n} more session${n !== 1 ? "s" : ""} to unlock`,
    confidence:"Signal",
    prelim:    "Preliminary Signals",
    confirmed: (n) => `Train ${n} more to confirm archetype`,
    sigAggr:   "Aggression",
    sigRange:  "Range",
    sigCounter:"Counter",
    sigVolume: "Volume",
  },
  mn: {
    dna:       "Тулаанчийн ДНХ",
    style:     "Хэв маягийн холимог",
    weapon:    "Шилдэг зэвсэг",
    weakness:  "Анхаарах чиглэл",
    fighters:  "Дагах тулаанч",
    evolution: "Дараагийн хөгжил",
    building:  "ДНХ бүрдүүлж байна",
    sessions:  (n) => `${n} session дасгал хийж нээ`,
    confidence:"Дохио",
    prelim:    "Анхны дохиолол",
    confirmed: (n) => `${n} session дасгал хийж баталгаажуул`,
    sigAggr:   "Агрессиость",
    sigRange:  "Зай",
    sigCounter:"Контр",
    sigVolume: "Хэмжээ",
  },
  ko: {
    dna:       "파이터 DNA",
    style:     "스타일 믹스",
    weapon:    "주요 무기",
    weakness:  "집중 영역",
    fighters:  "롤모델 파이터",
    evolution: "다음 진화",
    building:  "DNA 구축 중",
    sessions:  (n) => `${n}개 세션 더 훈련 후 공개`,
    confidence:"신호",
    prelim:    "초기 신호",
    confirmed: (n) => `${n}개 세션 더 훈련해서 확인`,
    sigAggr:   "공격성",
    sigRange:  "거리",
    sigCounter:"카운터",
    sigVolume: "볼륨",
  },
};

const SIGNAL_L = {
  en: { high:"HIGH", medium:"MEDIUM", emerging:"EMERGING", low:"LOW", building:"BUILDING", long:"LONG RANGE", close:"CLOSE RANGE", mid:"MID RANGE" },
  mn: { high:"ӨНДӨР", medium:"ДУНД", emerging:"ГАРЧ БАЙНА", low:"БАГ", building:"БҮРДЭЖ БАЙНА", long:"ХОЛ ЗАЙ", close:"ОЙРХОН", mid:"ДУНД ЗАЙ" },
  ko: { high:"높음", medium:"보통", emerging:"나타나는 중", low:"낮음", building:"형성 중", long:"장거리", close:"근거리", mid:"중거리" },
};

function StyleBar({ label, value, color }) {
  const pct = Math.min(100, (value / 10) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{
        width: 74, fontSize: 9, fontWeight: 900, letterSpacing: 1.2,
        color: whiteAlpha(0.38), textTransform: "uppercase", textAlign: "right", flexShrink: 0,
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 3, background: whiteAlpha(0.07), borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: color, borderRadius: 3,
          transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
          boxShadow: `0 0 6px ${color}66`,
        }} />
      </div>
      <span style={{
        width: 26, textAlign: "right", flexShrink: 0,
        fontSize: 11, fontWeight: 900, color: pct >= 50 ? color : whiteAlpha(0.35),
        fontFamily: "monospace",
      }}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}

function FighterChip({ fighter }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "8px 10px", borderRadius: 10, minWidth: 72, flexShrink: 0,
      background: `${fighter.accent}12`,
      border: `1px solid ${fighter.accent}30`,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        background: `${fighter.accent}20`,
        border: `1.5px solid ${fighter.accent}44`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 900, color: fighter.accent, marginBottom: 4,
      }}>
        {fighter.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
      </div>
      <span style={{ fontSize: 8.5, fontWeight: 800, color: whiteAlpha(0.55), textAlign: "center", lineHeight: 1.3, maxWidth: 56 }}>
        {fighter.name.split(" ").slice(-1)[0]}
      </span>
    </div>
  );
}

export default function FighterDNACard({ dna, locale = "en" }) {
  const L = SECTION_LABELS[locale] || SECTION_LABELS.en;
  const SL = SIGNAL_L[locale] || SIGNAL_L.en;

  // ── Building state ─────────────────────────────────────────────────────────
  if (!dna || dna.building) {
    const prelim = dna?.prelim;
    const signalColor = (lvl) =>
      lvl === "high" ? "#34D399" : (lvl === "medium" || lvl === "emerging") ? "#F59E0B" : whiteAlpha(0.28);

    return (
      <div style={{
        borderRadius: RADIUS.lg, overflow: "hidden",
        background: whiteAlpha(0.022), border: `1px solid ${whiteAlpha(0.06)}`,
      }}>
        {/* Header */}
        <div style={{ padding: "14px 16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 2, color: whiteAlpha(0.28), textTransform: "uppercase" }}>
              {prelim ? L.prelim : L.dna}
            </div>
            <div style={{ flex: 1, height: 1, background: whiteAlpha(0.05) }} />
            <div style={{ fontSize: 8, fontWeight: 900, color: goldAlpha(0.5), letterSpacing: 1 }}>🧬</div>
          </div>
        </div>

        {prelim ? (
          /* ── Preliminary signals ── */
          <div style={{ padding: "0 16px 16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: L.sigAggr,    val: prelim.aggression },
                { label: L.sigRange,   val: prelim.range },
                { label: L.sigCounter, val: prelim.counterInstinct },
                { label: L.sigVolume,  val: prelim.volume },
              ].map(({ label, val }) => {
                const color = signalColor(val);
                const barPct = val === "high" ? 82 : val === "medium" || val === "emerging" ? 52 : 22;
                return (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 64, fontSize: 8.5, fontWeight: 900, letterSpacing: 1, color: whiteAlpha(0.35), textTransform: "uppercase", flexShrink: 0, textAlign: "right" }}>
                      {label}
                    </span>
                    <div style={{ flex: 1, height: 3, background: whiteAlpha(0.07), borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${barPct}%`, height: "100%", background: color, borderRadius: 2, boxShadow: `0 0 5px ${color}55` }} />
                    </div>
                    <span style={{ width: 72, fontSize: 9, fontWeight: 900, color, letterSpacing: 1, flexShrink: 0 }}>
                      {SL[val] || val.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
            {dna?.sessionsNeeded > 0 && (
              <div style={{ marginTop: 12, fontSize: 9.5, color: whiteAlpha(0.28), fontWeight: 700, textAlign: "center" }}>
                {L.confirmed(dna.sessionsNeeded)}
              </div>
            )}
          </div>
        ) : (
          /* ── No data yet ── */
          <div style={{ padding: "0 16px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: goldAlpha(0.08), border: `1px solid ${goldAlpha(0.2)}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                🧬
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: whiteAlpha(0.55), marginBottom: 3 }}>{L.building}</div>
                {dna?.sessionsNeeded > 0 && (
                  <div style={{ fontSize: 10, color: whiteAlpha(0.28), fontWeight: 700 }}>{L.sessions(dna.sessionsNeeded)}</div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, opacity: 0.25 }}>
              {[80, 55, 65, 40, 70].map((w, i) => (
                <div key={i} style={{ height: 3, width: `${w}%`, borderRadius: 3, background: whiteAlpha(0.2) }} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const accentColor = STYLE_COLORS[dna.archetypeKey] || GOLD;
  const confidencePct = Math.round(dna.confidence * 100);
  const orderedStyles = Object.entries(dna.styleMix).sort(([, a], [, b]) => b - a);

  return (
    <div style={{
      borderRadius: RADIUS.lg, overflow: "hidden",
      border: `1px solid ${whiteAlpha(0.07)}`,
      background: "rgba(255,255,255,0.022)",
    }}>
      {/* ── Accent top bar ── */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${accentColor}88, transparent)` }} />

      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* ── Header ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 2, color: whiteAlpha(0.28), textTransform: "uppercase" }}>
              {L.dna}
            </span>
            <div style={{ flex: 1, height: 1, background: whiteAlpha(0.05) }} />
            <div style={{
              padding: "2px 8px", borderRadius: RADIUS.full,
              background: `${accentColor}18`, border: `1px solid ${accentColor}40`,
              fontSize: 8.5, fontWeight: 900, color: accentColor, letterSpacing: 1,
            }}>
              {confidencePct}% {L.confidence.toUpperCase()}
            </div>
          </div>

          <div style={{
            fontSize: 22, fontWeight: 1000, color: "#fff", lineHeight: 1.0,
            letterSpacing: "-0.02em",
            fontFamily: "var(--font-display, 'Anton', sans-serif)",
            textTransform: "uppercase",
            marginBottom: 5,
          }}>
            {dna.archetype}
          </div>

          <p style={{ margin: 0, fontSize: 11, color: whiteAlpha(0.42), lineHeight: 1.5, fontWeight: 600 }}>
            {dna.summary}
          </p>
        </div>

        {/* ── Style Mix bars ── */}
        <div>
          <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.8, color: whiteAlpha(0.28), textTransform: "uppercase", marginBottom: 9 }}>
            {L.style}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {orderedStyles.map(([key, val]) => (
              <StyleBar
                key={key}
                label={dna.styleLabels?.[key] || key}
                value={val}
                color={STYLE_COLORS[key] || whiteAlpha(0.5)}
              />
            ))}
          </div>
        </div>

        {/* ── Weapon / Weakness chips ── */}
        <div style={{ display: "flex", gap: 8 }}>
          {dna.bestWeaponLabel && (
            <div style={{
              flex: 1, padding: "8px 10px", borderRadius: 9,
              background: goldAlpha(0.06), border: `1px solid ${goldAlpha(0.2)}`,
            }}>
              <div style={{ fontSize: 8.5, fontWeight: 900, color: GOLD, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 3 }}>
                🥊 {L.weapon}
              </div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>
                {dna.bestWeaponLabel}
              </div>
            </div>
          )}
          {dna.mainWeakness && (
            <div style={{
              flex: 1, padding: "8px 10px", borderRadius: 9,
              background: redAlpha(0.06), border: `1px solid ${redAlpha(0.18)}`,
            }}>
              <div style={{ fontSize: 8.5, fontWeight: 900, color: "#FCA5A5", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 3 }}>
                ⚠️ {L.weakness}
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, color: whiteAlpha(0.72), lineHeight: 1.35 }}>
                {dna.mainWeakness}
              </div>
            </div>
          )}
        </div>

        {/* ── Recommended fighters ── */}
        {dna.recommendedFighters?.length > 0 && (
          <div>
            <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.8, color: whiteAlpha(0.28), textTransform: "uppercase", marginBottom: 9 }}>
              {L.fighters}
            </div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2, WebkitOverflowScrolling: "touch" }}>
              {dna.recommendedFighters.map((f) => (
                <FighterChip key={f.id} fighter={f} />
              ))}
            </div>
          </div>
        )}

        {/* ── Next evolution ── */}
        {dna.nextEvolution && (
          <div style={{
            padding: "9px 12px", borderRadius: 9,
            background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.16)",
          }}>
            <div style={{ fontSize: 8.5, fontWeight: 900, color: "#93C5FD", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>
              ⚡ {L.evolution}
            </div>
            <div style={{ fontSize: 12, color: whiteAlpha(0.7), lineHeight: 1.5 }}>
              {dna.nextEvolution}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
