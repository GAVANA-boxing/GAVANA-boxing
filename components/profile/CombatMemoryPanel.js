"use client";

import { useCombatMemory } from "@/hooks/useCombatMemory";
import { formatSessionAge } from "@/lib/combatMemory";
import { GOLD, RED, RADIUS, redAlpha, goldAlpha, whiteAlpha, blackAlpha } from "@/lib/tokens";

// ── Helpers ───────────────────────────────────────────────────────────────────
function SectionLabel({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "20px 0 12px" }}>
      <span style={{ width: 4, height: 4, borderRadius: "50%", background: goldAlpha(0.5), flexShrink: 0 }} />
      <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2.5, color: whiteAlpha(0.3), textTransform: "uppercase" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: whiteAlpha(0.05) }} />
    </div>
  );
}

function DeltaChip({ value, invertGood = false }) {
  if (value == null) return <span style={{ fontSize: 10, color: whiteAlpha(0.25), fontWeight: 700 }}>—</span>;
  const positive = value > 0;
  const good     = invertGood ? !positive : positive;
  const color    = value === 0 ? whiteAlpha(0.3) : good ? "#34D399" : "#F87171";
  const sign     = value > 0 ? "+" : "";
  return (
    <span style={{ fontSize: 11, fontWeight: 900, color, fontFamily: "monospace" }}>
      {sign}{value}%
    </span>
  );
}

function ScoreDeltaChip({ value }) {
  if (value == null) return <span style={{ fontSize: 10, color: whiteAlpha(0.25), fontWeight: 700 }}>—</span>;
  const color = value > 0 ? "#34D399" : value < 0 ? "#F87171" : whiteAlpha(0.3);
  return (
    <span style={{ fontSize: 11, fontWeight: 900, color, fontFamily: "monospace" }}>
      {value > 0 ? "+" : ""}{value}
    </span>
  );
}

function TrendRow({ label, delta, invertGood = false }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 0",
      borderBottom: `1px solid ${whiteAlpha(0.04)}`,
    }}>
      <span style={{ fontSize: 11, fontWeight: 800, color: whiteAlpha(0.5) }}>{label}</span>
      {invertGood
        ? <DeltaChip value={delta} invertGood />
        : <DeltaChip value={delta} />}
    </div>
  );
}

function IdentityPill({ identity }) {
  if (!identity) return null;
  return (
    <span style={{
      display: "inline-block",
      fontSize: 9, fontWeight: 900, letterSpacing: 1.5,
      color: whiteAlpha(0.45),
      background: whiteAlpha(0.05),
      border: `1px solid ${whiteAlpha(0.07)}`,
      borderRadius: RADIUS.full,
      padding: "2px 8px",
      textTransform: "uppercase",
      fontFamily: "monospace",
    }}>
      {identity}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CombatMemoryPanel({ user }) {
  const { sessions, tendency, trends, loading } = useCombatMemory({ user });

  if (loading) {
    return (
      <div style={{ padding: "32px 20px", textAlign: "center" }}>
        <div style={{ width: 28, height: 28, border: `2px solid ${whiteAlpha(0.08)}`, borderTopColor: RED, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ fontSize: 11, color: whiteAlpha(0.3), fontWeight: 700, margin: 0 }}>Analyzing sessions…</p>
      </div>
    );
  }

  const hasSessions  = sessions.length > 0;
  const hasMIData    = sessions.some((s) => s.movementCounts);
  const recentTen    = sessions.slice(0, 10);

  return (
    <div style={{ padding: "0 0 24px" }}>

      {/* ── Fighter Tendency ────────────────────────────────────── */}
      <SectionLabel label="Movement Tendency" />
      {tendency ? (
        <div style={{
          borderRadius: RADIUS.lg, padding: "16px 18px",
          background: "rgba(255,255,255,0.025)",
          border: `1px solid ${whiteAlpha(0.06)}`,
        }}>
          <h3 style={{
            margin: "0 0 4px",
            fontSize: 20, fontWeight: 1000, letterSpacing: "-0.02em",
            color: "#fff", lineHeight: 1.0,
            fontFamily: "var(--font-display, 'Anton', sans-serif)",
          }}>
            {tendency.title}
          </h3>
          <p style={{ margin: 0, fontSize: 11, color: whiteAlpha(0.38), fontWeight: 700 }}>
            {tendency.sub}
          </p>
          <p style={{ margin: "10px 0 0", fontSize: 9, color: whiteAlpha(0.22), fontWeight: 700, letterSpacing: 1 }}>
            Based on {sessions.filter(s => s.movementCounts).length} analyzed session{sessions.filter(s => s.movementCounts).length !== 1 ? "s" : ""}
          </p>
        </div>
      ) : (
        <div style={{
          borderRadius: RADIUS.lg, padding: "16px 18px",
          background: whiteAlpha(0.02), border: `1px solid ${whiteAlpha(0.05)}`,
          textAlign: "center",
        }}>
          <p style={{ margin: 0, fontSize: 12, color: whiteAlpha(0.3), fontWeight: 700 }}>
            Complete sessions with movement data to unlock tendency
          </p>
        </div>
      )}

      {/* ── Weekly Trends ────────────────────────────────────────── */}
      <SectionLabel label="This Week vs Last Week" />
      {trends && (trends.thisWeekCount > 0 || trends.lastWeekCount > 0) ? (
        <div style={{
          borderRadius: RADIUS.lg, padding: "10px 16px",
          background: whiteAlpha(0.02), border: `1px solid ${whiteAlpha(0.05)}`,
        }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
            <div style={{ flex: 1, textAlign: "center", padding: "8px", borderRadius: RADIUS.md, background: whiteAlpha(0.03), border: `1px solid ${whiteAlpha(0.06)}` }}>
              <div style={{ fontSize: 18, fontWeight: 1000, color: "#fff", fontFamily: "var(--font-display, 'Anton', sans-serif)" }}>{trends.thisWeekCount}</div>
              <div style={{ fontSize: 9, color: whiteAlpha(0.3), fontWeight: 800, letterSpacing: 1, marginTop: 2 }}>THIS WEEK</div>
            </div>
            <div style={{ flex: 1, textAlign: "center", padding: "8px", borderRadius: RADIUS.md, background: whiteAlpha(0.025), border: `1px solid ${whiteAlpha(0.05)}` }}>
              <div style={{ fontSize: 18, fontWeight: 1000, color: whiteAlpha(0.45), fontFamily: "var(--font-display, 'Anton', sans-serif)" }}>{trends.lastWeekCount}</div>
              <div style={{ fontSize: 9, color: whiteAlpha(0.25), fontWeight: 800, letterSpacing: 1, marginTop: 2 }}>LAST WEEK</div>
            </div>
          </div>

          {trends.pressureDelta != null  && <TrendRow label="Pressure frequency" delta={trends.pressureDelta} />}
          {trends.lateralDelta != null   && <TrendRow label="Lateral exits" delta={trends.lateralDelta} />}
          {trends.stabilityDelta != null && <TrendRow label="Guard stability" delta={trends.stabilityDelta} />}
          {trends.balanceLossDelta != null && <TrendRow label="Balance loss" delta={trends.balanceLossDelta} invertGood />}

          {/* Score avg row rendered separately since it uses a different chip */}
          {trends.scoreDelta != null && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${whiteAlpha(0.04)}` }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: whiteAlpha(0.5) }}>Score avg</span>
              <ScoreDeltaChip value={trends.scoreDelta} />
            </div>
          )}
        </div>
      ) : (
        <div style={{ borderRadius: RADIUS.lg, padding: "14px 18px", background: whiteAlpha(0.02), border: `1px solid ${whiteAlpha(0.05)}`, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 12, color: whiteAlpha(0.3), fontWeight: 700 }}>
            Train in two consecutive weeks to see trends
          </p>
        </div>
      )}

      {/* ── Session Archive ──────────────────────────────────────── */}
      <SectionLabel label="Session Archive" />
      {hasSessions ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {recentTen.map((s, i) => (
            <div key={s.id || i} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 14px", borderRadius: RADIUS.md,
              background: i === 0 ? "rgba(255,255,255,0.04)" : whiteAlpha(0.025),
              border: `1px solid ${i === 0 ? whiteAlpha(0.09) : whiteAlpha(0.05)}`,
            }}>
              {/* Score */}
              <span style={{
                flexShrink: 0, width: 36, textAlign: "center",
                fontSize: 16, fontWeight: 1000, color: i === 0 ? "#fff" : whiteAlpha(0.55),
                fontFamily: "var(--font-display, 'Anton', sans-serif)",
              }}>
                {s.score?.toFixed(1) ?? "—"}
              </span>

              {/* Identity + drill */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {s.sessionIdentity
                  ? <div style={{ fontSize: 10, fontWeight: 900, color: whiteAlpha(0.7), letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 2 }}>
                      {s.sessionIdentity}
                    </div>
                  : <div style={{ fontSize: 10, fontWeight: 900, color: whiteAlpha(0.35), letterSpacing: 0.5 }}>
                      TRAINING SESSION
                    </div>
                }
                {s.drillId && s.drillId !== "default" && (
                  <span style={{ fontSize: 9, color: whiteAlpha(0.25), fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase" }}>
                    {s.drillId}
                  </span>
                )}
              </div>

              {/* Time */}
              <span style={{ fontSize: 9, color: whiteAlpha(0.25), fontWeight: 700, flexShrink: 0, fontFamily: "monospace" }}>
                {formatSessionAge(s.createdAt?.seconds)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ borderRadius: RADIUS.lg, padding: "20px 18px", background: whiteAlpha(0.02), border: `1px solid ${whiteAlpha(0.05)}`, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 13, color: whiteAlpha(0.3), fontWeight: 700 }}>No sessions recorded yet</p>
          <p style={{ margin: "6px 0 0", fontSize: 11, color: whiteAlpha(0.2), fontWeight: 700 }}>Complete a training session to build your fighter profile</p>
        </div>
      )}
    </div>
  );
}
