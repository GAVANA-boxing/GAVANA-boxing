"use client";

import { GOLD, RADIUS, whiteAlpha, goldAlpha } from "@/lib/tokens";
import { SKILL_COLORS } from "@/lib/combatProgress";
import { PROGRESS_LABELS } from "@/lib/profileLabels";

const LEVEL_COLOR = "#F5C451";

function SkillBar({ label, value, color }) {
  const pct = Math.min(100, (value / 10) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{
        width: 88, fontSize: 9, fontWeight: 900, letterSpacing: 1,
        color: whiteAlpha(0.38), textTransform: "uppercase", flexShrink: 0,
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 3, background: whiteAlpha(0.07), borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, borderRadius: 3,
          background: color,
          boxShadow: `0 0 6px ${color}55`,
          transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
        }} />
      </div>
      <span style={{
        width: 24, textAlign: "right", flexShrink: 0,
        fontSize: 11, fontWeight: 900,
        color: pct >= 50 ? color : whiteAlpha(0.3),
        fontFamily: "monospace",
      }}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}

export default function CombatProgressCard({ progress, locale = "en" }) {
  const L = PROGRESS_LABELS[locale] || PROGRESS_LABELS.en;

  // ── Building state ──────────────────────────────────────────────────────────
  if (!progress || progress.building) {
    return (
      <div style={{
        borderRadius: RADIUS.lg, padding: "16px 18px",
        background: whiteAlpha(0.022), border: `1px solid ${whiteAlpha(0.06)}`,
        marginBottom: 4,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 2, color: whiteAlpha(0.28), textTransform: "uppercase" }}>
            {L.level}
          </span>
          <div style={{ flex: 1, height: 1, background: whiteAlpha(0.05) }} />
        </div>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: whiteAlpha(0.3) }}>
          {L.sessions(progress?.sessionsNeeded ?? 3)}
        </p>
        {/* Ghost bars */}
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 7, opacity: 0.2 }}>
          {[70, 50, 80, 45, 60].map((w, i) => (
            <div key={i} style={{ height: 3, width: `${w}%`, borderRadius: 3, background: whiteAlpha(0.2) }} />
          ))}
        </div>
      </div>
    );
  }

  const { levelData, skills, skillLabels, timeline, punchTrend } = progress;
  const levelName = levelData[locale] || levelData.en;

  return (
    <div style={{
      borderRadius: RADIUS.lg, overflow: "hidden",
      border: `1px solid ${whiteAlpha(0.07)}`,
      background: "rgba(255,255,255,0.022)",
      marginBottom: 4,
    }}>
      {/* Accent top bar */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${LEVEL_COLOR}88, transparent)` }} />

      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* ── Level block ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 2, color: whiteAlpha(0.28), textTransform: "uppercase" }}>
              {L.level}
            </span>
            <div style={{ flex: 1, height: 1, background: whiteAlpha(0.05) }} />
            <span style={{
              padding: "2px 8px", borderRadius: RADIUS.full,
              background: `${LEVEL_COLOR}18`, border: `1px solid ${LEVEL_COLOR}40`,
              fontSize: 8.5, fontWeight: 900, color: LEVEL_COLOR, letterSpacing: 1,
            }}>
              {levelData.xp} {L.xp}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: RADIUS.md,
              background: `${LEVEL_COLOR}18`, border: `1px solid ${LEVEL_COLOR}35`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 18, fontWeight: 1000, color: LEVEL_COLOR, fontFamily: "monospace" }}>
                {levelData.level}
              </span>
            </div>
            <div>
              <div style={{
                fontSize: 20, fontWeight: 1000, color: "#fff", lineHeight: 1.0,
                letterSpacing: "-0.02em",
                fontFamily: "var(--font-display, 'Anton', sans-serif)",
                textTransform: "uppercase",
              }}>
                {levelName}
              </div>
              {levelData.nextName && (
                <div style={{ fontSize: 9.5, color: whiteAlpha(0.3), fontWeight: 700, marginTop: 2 }}>
                  {levelData.xpToNext - levelData.xpInLevel} {L.xp} {L.toNext}
                </div>
              )}
            </div>
          </div>

          {/* XP progress bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 8.5, fontWeight: 800, color: whiteAlpha(0.25), letterSpacing: 0.5 }}>
                {levelData.maxLevel ? L.maxLevel : `${L.progress} · ${levelData.progressPct}%`}
              </span>
              {levelData.nextName && (
                <span style={{ fontSize: 8.5, fontWeight: 800, color: whiteAlpha(0.25) }}>
                  {levelData.nextName[locale] || levelData.nextName.en}
                </span>
              )}
            </div>
            <div style={{ height: 3, borderRadius: 3, background: whiteAlpha(0.07), overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${levelData.progressPct}%`, borderRadius: 3,
                background: `linear-gradient(90deg, ${LEVEL_COLOR}80, ${LEVEL_COLOR})`,
                transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
              }} />
            </div>
          </div>
        </div>

        {/* ── Skill mastery ── */}
        <div>
          <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.8, color: whiteAlpha(0.28), textTransform: "uppercase", marginBottom: 9 }}>
            {L.skills}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(skills).map(([key, val]) => (
              <SkillBar
                key={key}
                label={skillLabels?.[key] || key}
                value={val}
                color={SKILL_COLORS[key] || whiteAlpha(0.5)}
              />
            ))}
          </div>
        </div>

        {/* ── Punch pattern evolution ── */}
        {punchTrend && (
          <div>
            <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.8, color: whiteAlpha(0.28), textTransform: "uppercase", marginBottom: 9 }}>
              📊 {L.punchTrend}
            </div>
            {[
              { label: "Jab",   earlyPct: punchTrend.early.jab,   recentPct: punchTrend.recent.jab,   color: "#3B82F6" },
              { label: "Cross", earlyPct: punchTrend.early.cross, recentPct: punchTrend.recent.cross, color: "#EF4444" },
              { label: "Hook",  earlyPct: punchTrend.early.hook,  recentPct: punchTrend.recent.hook,  color: "#8B5CF6" },
            ].map(({ label, earlyPct, recentPct, color }) => {
              const delta = recentPct - earlyPct;
              return (
                <div key={label} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: whiteAlpha(0.38), textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</span>
                    <span style={{ fontSize: 9, fontWeight: 900, color: delta > 0 ? "#34D399" : delta < 0 ? "#F87171" : whiteAlpha(0.3) }}>
                      {delta > 0 ? "+" : ""}{delta}%
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <div style={{ flex: 1, height: 4, background: whiteAlpha(0.06), borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${earlyPct}%`, background: whiteAlpha(0.2), borderRadius: 3 }} />
                    </div>
                    <div style={{ flex: 1, height: 4, background: whiteAlpha(0.06), borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${recentPct}%`, background: color, borderRadius: 3, transition: "width 1s cubic-bezier(0.16,1,0.3,1)" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                    <span style={{ fontSize: 8, color: whiteAlpha(0.22) }}>{L.early} {earlyPct}%</span>
                    <span style={{ fontSize: 8, color: whiteAlpha(0.22) }}>{L.recent} {recentPct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Evolution timeline ── */}
        {timeline?.length > 0 && (
          <div>
            <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.8, color: whiteAlpha(0.28), textTransform: "uppercase", marginBottom: 9 }}>
              {L.timeline}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {timeline.map((event, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "7px 0",
                  borderBottom: i < timeline.length - 1 ? `1px solid ${whiteAlpha(0.04)}` : "none",
                }}>
                  <span style={{ fontSize: 14, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{event.emoji}</span>
                  <span style={{ fontSize: 11, color: whiteAlpha(0.55), fontWeight: 700, lineHeight: 1.4 }}>
                    {event.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
