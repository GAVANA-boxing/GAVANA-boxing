"use client";

// Home: the coach's daily assignment for this student — today's rounds as dots (done / goal) and
// one button. Rendered only when the student is on a coach's team.
import { loc } from "@/lib/loc";
import { BENCHMARKS } from "@/lib/benchmarks";
import { BRAND, card } from "@/components/ui/brand";

export default function CoachAssignmentCard({ locale, team, todayCount = 0, onStart }) {
  if (!team) return null;
  const L = (mn, ko, en) => loc(locale, mn, ko, en);
  const goal = team.roundsPerDay;
  const done = todayCount >= goal;
  const drill = BENCHMARKS.find((b) => b.id === team.drill);
  return (
    <section data-testid="coach-assignment" style={{ ...card, padding: 16, display: "flex", alignItems: "center", gap: 12, borderColor: done ? "rgba(52,211,153,0.35)" : "rgba(255,59,48,0.3)" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: BRAND.faint }}>
          🥊 {team.coachName || L("Дасгалжуулагч", "코치", "Coach")}{drill ? ` · ${drill.icon} ${L(drill.name.mn, drill.name.ko, drill.name.en)}` : ""}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 8 }} aria-label={L(`Өнөөдөр ${Math.min(todayCount, goal)}/${goal}`, `오늘 ${Math.min(todayCount, goal)}/${goal}`, `Today ${Math.min(todayCount, goal)}/${goal}`)}>
          {Array.from({ length: goal }, (_, i) => (
            <span key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: i < todayCount ? (done ? "#34D399" : BRAND.red) : "rgba(255,255,255,0.12)" }} />
          ))}
          <span style={{ fontSize: 14, fontWeight: 700, color: done ? "#34D399" : BRAND.text, marginLeft: 4 }}>
            {done ? "✓" : `${todayCount}/${goal}`}
          </span>
        </div>
      </div>
      {!done && (
        <button type="button" onClick={onStart}
          style={{ minHeight: 44, padding: "0 16px", borderRadius: 12, border: "none", background: BRAND.red, color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
          {L("Раунд", "라운드", "Round")} →
        </button>
      )}
    </section>
  );
}
