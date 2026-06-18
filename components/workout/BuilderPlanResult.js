"use client";

import { RED, GOLD, redAlpha, goldAlpha } from "@/lib/tokens";
import { CombatCard, GlassCard } from "@/components/ui";
import { GOALS, LEVELS, label } from "./builderConstants";

const s = {
  resultWrap: { display: "flex", flexDirection: "column", gap: 12 },
  summaryStrip: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 },
  summaryChip: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "4px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  summaryText: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)" },
  dayTitle: { fontSize: 13, fontWeight: 900, color: "#fff", marginBottom: 10, letterSpacing: 0.2 },
  restText: { margin: 0, fontSize: 13, color: "rgba(255,255,255,0.35)", fontStyle: "italic" },
  itemList: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 },
  itemRow: { display: "flex", alignItems: "flex-start", gap: 8 },
  itemBullet: { color: RED, fontSize: 10, marginTop: 3, flexShrink: 0 },
  itemText: { fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.45 },
  tipsTitle: { margin: "0 0 10px", fontSize: 12, fontWeight: 900, color: GOLD, textTransform: "uppercase", letterSpacing: 0.5 },
  tipRow: { margin: "0 0 6px", fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.45 },
  errorText: { margin: "10px 0 0", fontSize: 12, color: "#F87171", textAlign: "center" },
  actionRow: { display: "flex", gap: 8, marginTop: 4 },
  saveBtn: {
    flex: 2,
    padding: 14,
    borderRadius: 14,
    border: "none",
    background: `linear-gradient(145deg, ${RED}, #cc2820)`,
    color: "#fff",
    fontSize: 14,
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: `0 6px 18px ${redAlpha(0.28)}`,
  },
  savedBtn: {
    flex: 2,
    padding: 14,
    borderRadius: 14,
    border: "1px solid rgba(52,211,153,0.3)",
    background: "rgba(52,211,153,0.08)",
    color: "#34D399",
    fontSize: 14,
    fontWeight: 900,
    cursor: "not-allowed",
  },
  saveBtnDisabled: {
    flex: 2,
    padding: 14,
    borderRadius: 14,
    border: "none",
    background: `${redAlpha(0.25)}`,
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
    fontWeight: 900,
    cursor: "not-allowed",
  },
  rebuildBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "transparent",
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
};

/**
 * @param {{
 *   plan: { days: Array<{title:string, items:string[], isRest:boolean}>, tips: string[] },
 *   goal: string,
 *   level: string,
 *   days: number,
 *   duration: number,
 *   locale: string,
 *   saving: boolean,
 *   saved: boolean,
 *   error: string,
 *   onSave: () => void,
 *   onRebuild: () => void,
 *   perWeekLabel: string,
 *   minUnit: string,
 *   restLabel: string,
 *   tipsLabel: string,
 *   saveLabel: string,
 *   savedLabel: string,
 *   rebuildLabel: string,
 * }} props
 */
export default function BuilderPlanResult({
  plan,
  goal,
  level,
  days,
  duration,
  locale,
  saving,
  saved,
  error,
  onSave,
  onRebuild,
  perWeekLabel,
  minUnit,
  restLabel,
  tipsLabel,
  saveLabel,
  savedLabel,
  rebuildLabel,
}) {
  const goalMeta = GOALS.find((g) => g.key === goal);
  const levelMeta = LEVELS.find((l) => l.key === level);

  const summaryItems = [
    { icon: goalMeta?.emoji || "🥊", text: label(goalMeta || { en: goal }, locale) },
    { icon: "📊", text: label(levelMeta || { en: level }, locale) },
    { icon: "📅", text: `${days}x ${perWeekLabel}` },
    { icon: "⏱", text: `${duration} ${minUnit}` },
  ];

  return (
    <div style={s.resultWrap}>
      {/* Summary strip */}
      <div style={s.summaryStrip}>
        {summaryItems.map(({ icon, text }) => (
          <div key={text} style={s.summaryChip}>
            <span style={{ fontSize: 14 }}>{icon}</span>
            <span style={s.summaryText}>{text}</span>
          </div>
        ))}
      </div>

      {/* Day cards */}
      {plan.days.map((day, i) => (
        <CombatCard
          key={i}
          accent={!day.isRest}
          style={{
            marginBottom: 8,
            padding: "14px 16px",
            ...(day.isRest ? { borderColor: "rgba(255,255,255,0.08)" } : {}),
          }}
        >
          <div style={s.dayTitle}>{day.title}</div>
          {day.isRest ? (
            <p style={s.restText}>{restLabel} 💤</p>
          ) : (
            <ul style={s.itemList}>
              {day.items.map((item, j) => (
                <li key={j} style={s.itemRow}>
                  <span style={s.itemBullet}>▸</span>
                  <span style={s.itemText}>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </CombatCard>
      ))}

      {/* Tips */}
      {plan.tips.length > 0 && (
        <GlassCard
          style={{
            padding: "14px 16px",
            marginBottom: 8,
            border: `1px solid ${goldAlpha(0.18)}`,
            background: goldAlpha(0.06),
          }}
        >
          <p style={s.tipsTitle}>💡 {tipsLabel}</p>
          {plan.tips.map((tip, i) => (
            <p key={i} style={s.tipRow}>• {tip}</p>
          ))}
        </GlassCard>
      )}

      {error && <p style={s.errorText}>{error}</p>}

      {/* Action buttons */}
      <div style={s.actionRow}>
        <button
          type="button"
          style={saved ? s.savedBtn : saving ? s.saveBtnDisabled : s.saveBtn}
          disabled={saving || saved}
          onClick={onSave}
        >
          {saved ? savedLabel : saving ? "…" : saveLabel}
        </button>
        <button type="button" style={s.rebuildBtn} onClick={onRebuild}>
          {rebuildLabel}
        </button>
      </div>
    </div>
  );
}
