"use client";

import {
  formatSessionAge,
  computeMovementProfile,
  topMovementType,
  MOVEMENT_LABELS,
  interpretMovementProfile,
  deriveArchiveLabel,
} from "@/lib/combatMemory";
import { GOLD, RED, RADIUS, redAlpha, goldAlpha, whiteAlpha, blackAlpha } from "@/lib/tokens";

// ── Internal helpers ──────────────────────────────────────────────────────────
function SectionLabel({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "24px 0 12px" }}>
      <span style={{ width: 3, height: 3, borderRadius: "50%", background: goldAlpha(0.45), flexShrink: 0 }} />
      <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2.5, color: whiteAlpha(0.28), textTransform: "uppercase" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: whiteAlpha(0.04) }} />
    </div>
  );
}

// Thin trait bar — normalised 0-1, cap at 3 events/session for full bar
function TraitBar({ label, value, cap = 3 }) {
  const pct = Math.min(100, (value / cap) * 100);
  const isEmpty = value === 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0" }}>
      <span style={{ width: 88, fontSize: 9, fontWeight: 800, letterSpacing: 1.2, color: whiteAlpha(isEmpty ? 0.18 : 0.35), textTransform: "uppercase", textAlign: "right", flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 2, background: whiteAlpha(0.06), borderRadius: 2, overflow: "hidden" }}>
        {!isEmpty && (
          <div style={{ height: "100%", width: `${pct}%`, background: whiteAlpha(0.38), borderRadius: 2, transition: "width 0.9s cubic-bezier(0.16,1,0.3,1)" }} />
        )}
      </div>
      <span style={{ width: 24, fontSize: 10, fontWeight: 800, color: whiteAlpha(isEmpty ? 0.18 : 0.48), textAlign: "right", flexShrink: 0, fontFamily: "monospace" }}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}

function TrendRow({ label, delta, invertGood = false, isScore = false }) {
  const good  = isScore ? delta >= 0 : (invertGood ? delta <= 0 : delta >= 0);
  const color = delta == null || delta === 0 ? whiteAlpha(0.28) : good ? "#34D399" : "#F87171";
  const display = delta == null ? "—"
    : isScore ? `${delta > 0 ? "+" : ""}${delta}`
    : `${delta > 0 ? "+" : ""}${delta}%`;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${whiteAlpha(0.04)}` }}>
      <span style={{ fontSize: 11, fontWeight: 800, color: whiteAlpha(0.45) }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 900, color, fontFamily: "monospace" }}>{display}</span>
    </div>
  );
}

function scoreColor(score) {
  if (score >= 8) return GOLD;
  if (score >= 6) return "#fff";
  if (score >= 4) return whiteAlpha(0.6);
  return whiteAlpha(0.35);
}

function MovementChip({ movementCounts }) {
  const top = topMovementType(movementCounts);
  if (!top) return null;
  const label = MOVEMENT_LABELS[top.type] || top.type.toLowerCase().replace(/_/g, " ");
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 9, fontWeight: 800,
      color: whiteAlpha(0.32),
      background: whiteAlpha(0.04),
      border: `1px solid ${whiteAlpha(0.06)}`,
      borderRadius: RADIUS.full,
      padding: "2px 7px",
      textTransform: "lowercase",
    }}>
      <span style={{ fontSize: 7 }}>●</span>
      {label} ×{top.count}
    </span>
  );
}

// ── Cinematic empty state ─────────────────────────────────────────────────────
function EmptyState({ onTrain }) {
  return (
    <div style={{
      minHeight: 320, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "40px 24px", textAlign: "center",
      background: `radial-gradient(ellipse at 50% 60%, rgba(255,59,48,0.06) 0%, transparent 70%)`,
      borderRadius: RADIUS.xl,
      border: `1px solid ${whiteAlpha(0.05)}`,
      marginTop: 20,
    }}>
      {/* Icon */}
      <div style={{
        width: 52, height: 52, borderRadius: 16, marginBottom: 20,
        background: "rgba(255,59,48,0.09)",
        border: `1px solid rgba(255,59,48,0.18)`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,59,48,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      </div>

      <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 1000, color: "#fff", letterSpacing: "-0.01em" }}>
        No sessions recorded
      </p>
      <p style={{ margin: "0 0 24px", fontSize: 12, color: whiteAlpha(0.35), fontWeight: 700, lineHeight: 1.5, maxWidth: 220 }}>
        Complete a training session to start building your fighter memory
      </p>

      {onTrain && (
        <button
          type="button"
          onClick={onTrain}
          style={{
            padding: "11px 28px", borderRadius: RADIUS.full,
            background: "linear-gradient(145deg, #FF3B30, #cc2820)",
            border: "none", color: "#fff",
            fontSize: 13, fontWeight: 900, cursor: "pointer",
            boxShadow: "0 8px 24px rgba(255,59,48,0.28)",
          }}
        >
          Start Training
        </button>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CombatMemoryPanel({ sessions = [], tendency, trends, loading, onTrain }) {
  if (loading) {
    return (
      <div style={{ padding: "48px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ width: 24, height: 24, border: `2px solid ${whiteAlpha(0.07)}`, borderTopColor: RED, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ fontSize: 10, color: whiteAlpha(0.25), fontWeight: 700, letterSpacing: 1 }}>READING MEMORY</span>
      </div>
    );
  }

  if (!sessions.length) return <EmptyState onTrain={onTrain} />;

  const hasMIData      = sessions.some((s) => s.movementCounts);
  const profile        = computeMovementProfile(sessions);
  const miCount        = sessions.filter((s) => s.movementCounts).length;
  const recentTen      = sessions.slice(0, 10);

  return (
    <div style={{ paddingBottom: 8 }}>

      {/* ── Movement Tendency ─────────────────────────────────────── */}
      <SectionLabel label="Movement Tendency" />

      {tendency && profile ? (
        <div style={{
          borderRadius: RADIUS.lg, padding: "18px 18px 14px",
          background: "rgba(255,255,255,0.022)",
          border: `1px solid ${whiteAlpha(0.06)}`,
        }}>
          {/* Title */}
          <h3 style={{
            margin: "0 0 3px", fontSize: 21, fontWeight: 1000,
            letterSpacing: "-0.02em", color: "#fff", lineHeight: 1.0,
            fontFamily: "var(--font-display, 'Anton', sans-serif)",
          }}>
            {tendency.title}
          </h3>
          <p style={{ margin: "0 0 16px", fontSize: 11, color: whiteAlpha(0.36), fontWeight: 700 }}>
            {tendency.sub}
          </p>

          {/* Trait bars — only show non-zero or key ones */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <TraitBar label="Pressure"    value={profile.pressure} />
            <TraitBar label="Lateral"     value={profile.lateral} />
            <TraitBar label="Head mvmt"   value={profile.headMovement} />
            <TraitBar label="Guard drift" value={profile.guardUnstable} />
            <TraitBar label="Balance"     value={profile.balanceShift} />
          </div>

          {/* Human-readable interpretation */}
          {(() => {
            const lines = interpretMovementProfile(profile);
            return lines.length > 0 ? (
              <div style={{ margin: "10px 0 0", display: "flex", flexDirection: "column", gap: 4 }}>
                {lines.map((line, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 3, height: 3, borderRadius: "50%", background: whiteAlpha(0.2), flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: whiteAlpha(0.38), fontWeight: 700 }}>{line}</span>
                  </div>
                ))}
              </div>
            ) : null;
          })()}

          <p style={{ margin: "10px 0 0", fontSize: 9, color: whiteAlpha(0.2), fontWeight: 700, letterSpacing: 0.8 }}>
            Avg per session · {miCount} session{miCount !== 1 ? "s" : ""} analyzed
          </p>
        </div>
      ) : hasMIData ? (
        <div style={{ borderRadius: RADIUS.lg, padding: "14px 16px", background: whiteAlpha(0.02), border: `1px solid ${whiteAlpha(0.05)}` }}>
          <p style={{ margin: 0, fontSize: 12, color: whiteAlpha(0.3), fontWeight: 700 }}>Building profile — train more sessions to unlock tendency</p>
        </div>
      ) : (
        <div style={{ borderRadius: RADIUS.lg, padding: "14px 16px", background: whiteAlpha(0.02), border: `1px solid ${whiteAlpha(0.05)}` }}>
          <p style={{ margin: 0, fontSize: 12, color: whiteAlpha(0.3), fontWeight: 700 }}>Save sessions to build your movement profile</p>
        </div>
      )}

      {/* ── This Week vs Last Week ────────────────────────────────── */}
      <SectionLabel label="Week Comparison" />

      {trends && (trends.thisWeekCount > 0 || trends.lastWeekCount > 0) ? (
        <div style={{
          borderRadius: RADIUS.lg, overflow: "hidden",
          border: `1px solid ${whiteAlpha(0.06)}`,
        }}>
          {/* Count header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: whiteAlpha(0.02) }}>
            <div style={{ padding: "12px 16px", borderRight: `1px solid ${whiteAlpha(0.05)}` }}>
              <div style={{ fontSize: 22, fontWeight: 1000, color: "#fff", fontFamily: "var(--font-display, 'Anton', sans-serif)", lineHeight: 1 }}>
                {trends.thisWeekCount}
              </div>
              <div style={{ fontSize: 9, color: whiteAlpha(0.28), fontWeight: 800, letterSpacing: 1.5, marginTop: 4 }}>THIS WEEK</div>
            </div>
            <div style={{ padding: "12px 16px" }}>
              <div style={{ fontSize: 22, fontWeight: 1000, color: whiteAlpha(0.38), fontFamily: "var(--font-display, 'Anton', sans-serif)", lineHeight: 1 }}>
                {trends.lastWeekCount}
              </div>
              <div style={{ fontSize: 9, color: whiteAlpha(0.2), fontWeight: 800, letterSpacing: 1.5, marginTop: 4 }}>LAST WEEK</div>
            </div>
          </div>

          {/* Trend rows */}
          <div style={{ padding: "2px 16px 6px", background: "rgba(255,255,255,0.015)" }}>
            {trends.scoreDelta        != null && <TrendRow label="Score avg"          delta={trends.scoreDelta}        isScore />}
            {trends.pressureDelta     != null && <TrendRow label="Pressure frequency" delta={trends.pressureDelta} />}
            {trends.lateralDelta      != null && <TrendRow label="Lateral exits"      delta={trends.lateralDelta} />}
            {trends.stabilityDelta    != null && <TrendRow label="Guard stability"    delta={trends.stabilityDelta} />}
            {trends.balanceLossDelta  != null && <TrendRow label="Balance loss"       delta={trends.balanceLossDelta} invertGood />}
          </div>
        </div>
      ) : (
        <div style={{ borderRadius: RADIUS.lg, padding: "14px 16px", background: whiteAlpha(0.02), border: `1px solid ${whiteAlpha(0.05)}`, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 12, color: whiteAlpha(0.3), fontWeight: 700 }}>Train in two consecutive weeks to unlock comparison</p>
        </div>
      )}

      {/* ── Session Archive ───────────────────────────────────────── */}
      <SectionLabel label="Session Archive" />

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {recentTen.map((s, i) => {
          const sc = s.score ?? null;
          const top = topMovementType(s.movementCounts);
          const isLatest = i === 0;
          const drill = s.drillId && s.drillId !== "default" ? s.drillId.replace(/-/g, " ") : null;
          const dur = s.durationSeconds ? `${s.durationSeconds}s` : null;
          const sessionLabel = (s.movementCounts || s.sessionIdentity)
            ? deriveArchiveLabel(s)
            : "Building profile";

          return (
            <div key={s.id || i} style={{
              borderRadius: RADIUS.md, padding: "12px 14px",
              background: isLatest ? "rgba(255,255,255,0.038)" : "rgba(255,255,255,0.018)",
              border: `1px solid ${isLatest ? whiteAlpha(0.09) : whiteAlpha(0.05)}`,
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>

                {/* Score */}
                <div style={{
                  flexShrink: 0, width: 42, height: 42,
                  borderRadius: RADIUS.md,
                  background: whiteAlpha(0.04),
                  border: `1px solid ${whiteAlpha(0.07)}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{
                    fontSize: 16, fontWeight: 1000, lineHeight: 1,
                    color: sc != null ? scoreColor(sc) : whiteAlpha(0.3),
                    fontFamily: "var(--font-display, 'Anton', sans-serif)",
                  }}>
                    {sc != null ? sc.toFixed(1) : "—"}
                  </span>
                </div>

                {/* Body */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 900,
                      color: sessionLabel === "Building profile"
                        ? whiteAlpha(0.25)
                        : whiteAlpha(isLatest ? 0.82 : 0.65),
                      letterSpacing: 0.3, textTransform: "uppercase",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      maxWidth: "calc(100% - 48px)",
                    }}>
                      {sessionLabel}
                    </span>
                    <span style={{ fontSize: 9, color: whiteAlpha(0.22), fontWeight: 700, flexShrink: 0, fontFamily: "monospace", marginLeft: 8 }}>
                      {formatSessionAge(s.createdAt?.seconds)}
                    </span>
                  </div>

                  {/* Meta row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    {drill && (
                      <span style={{ fontSize: 9, color: whiteAlpha(0.28), fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.8 }}>
                        {drill}
                      </span>
                    )}
                    {dur && (
                      <span style={{ fontSize: 9, color: whiteAlpha(0.22), fontWeight: 700, fontFamily: "monospace" }}>
                        {dur}
                      </span>
                    )}
                    {top && s.movementCounts && (
                      <MovementChip movementCounts={s.movementCounts} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ height: 16 }} />
    </div>
  );
}
