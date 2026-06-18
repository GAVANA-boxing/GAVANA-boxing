"use client";

import s from "@/components/programs/programsStyles";
import { RED } from "@/lib/tokens";

/**
 * Props:
 *   program         object   — selected program (has .title, .sessions[])
 *   todayChecked    object   — { [sessionIndex]: bool }
 *   allSessionsDone bool
 *   completingDay   bool
 *   t               (key: string) => string
 *   onToggleSession (index: number, checked: bool) => void
 *   onCompleteDay   () => void
 *   onClose         () => void
 */
export default function SessionSheet({
  program,
  todayChecked,
  allSessionsDone,
  completingDay,
  t,
  onToggleSession,
  onCompleteDay,
  onClose,
}) {
  if (!program) return null;

  return (
    <div style={s.sheetWrap}>
      <div style={s.sheetOverlay} onClick={onClose} />
      <div style={s.sheet}>
        <div style={s.sheetHandle} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <p style={s.sheetKicker}>{t("programsTodaySessions")}</p>
            <p style={s.sheetTitle}>{program.title}</p>
          </div>
          <button type="button" style={s.closeSheetBtn} onClick={onClose}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {(program.sessions || []).map((session, i) => (
            <label
              key={i}
              style={{
                ...s.sessionRow,
                background: todayChecked[i] ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.04)",
                borderColor: todayChecked[i] ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.08)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={!!todayChecked[i]}
                onChange={(e) => onToggleSession(i, e.target.checked)}
                style={{ width: 18, height: 18, accentColor: "#34D399", flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <p style={{
                  margin: 0, fontSize: 14, fontWeight: 800,
                  color: todayChecked[i] ? "#34D399" : "#fff",
                  textDecoration: todayChecked[i] ? "line-through" : "none",
                }}>
                  {session.name}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#888" }}>{session.duration}</p>
              </div>
              {todayChecked[i] && <span style={{ fontSize: 16, flexShrink: 0, color: "#34D399" }}>✓</span>}
            </label>
          ))}
        </div>

        <button
          type="button"
          style={{
            ...s.completeDayBtn,
            background: allSessionsDone ? "#34D399" : RED,
            opacity: completingDay ? 0.6 : 1,
          }}
          onClick={onCompleteDay}
          disabled={completingDay}
        >
          {completingDay ? "…" : t("programsCompleteDay")}
        </button>
      </div>
    </div>
  );
}
