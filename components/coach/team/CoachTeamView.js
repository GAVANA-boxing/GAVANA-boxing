"use client";

// Coach screen "my students" — presentational (data + callbacks come from the page, so the
// fixture /visual/coach-team can render it with demo data). Little text: a code to share,
// today's assignment, and one row per student (today's dots, last score, first → latest).
import { loc } from "@/lib/loc";
import { BENCHMARKS } from "@/lib/benchmarks";
import { MAX_ROUNDS_PER_DAY, daysAgo } from "@/lib/coach/team";
import { BRAND, btnPrimary, card, displayTitle, kickerDot, kickerPill, sectionLabel } from "@/components/ui/brand";

const UP = "#34D399";
const DOWN = "#F87171";

export default function CoachTeamView({ locale, team, students = [], now = Date.now(), tzOffsetMin = 0, busy, onCreate, onSave, onRemove, onShare }) {
  const L = (mn, ko, en) => loc(locale, mn, ko, en);

  if (!team) {
    return (
      <div style={wrap}>
        <Header L={L} />
        <section style={{ ...card, padding: 22, textAlign: "center" }}>
          <div aria-hidden="true" style={{ fontSize: 40 }}>🥊</div>
          <p style={{ margin: "10px 0 18px", fontSize: 16, color: BRAND.muted }}>
            {L("Шавь нарынхаа раунд, ахицыг нэг дэлгэцээс хар.", "제자들의 라운드와 성장을 한 화면에서.", "See your students' rounds and progress on one screen.")}
          </p>
          <button type="button" style={btnPrimary} onClick={onCreate} disabled={busy}>
            {L("Баг үүсгэх", "팀 만들기", "Create my team")}
          </button>
        </section>
      </div>
    );
  }

  const done = students.filter((s) => s.summary.doneToday).length;
  const goal = team.roundsPerDay;

  return (
    <div style={wrap}>
      <Header L={L} />

      {/* Invite code */}
      <section style={{ ...card, padding: 18, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: BRAND.faint }}>{L("Урих код", "초대 코드", "Invite code")}</div>
          <div data-testid="team-code" style={{ ...displayTitle, fontSize: 34, letterSpacing: "0.12em", marginTop: 4 }}>{team.code}</div>
          <div style={{ fontSize: 12, color: BRAND.faint, marginTop: 4 }}>{L("Шавь: Коуч → код оруулах", "제자: 코치 → 코드 입력", "Student: Coach → enter code")}</div>
        </div>
        <button type="button" onClick={() => onShare?.(team.code)} style={pill}>
          {L("Хуваалцах", "공유", "Share")}
        </button>
      </section>

      {/* Today's assignment */}
      <section style={{ ...card, padding: 18, marginTop: 12 }}>
        <p style={sectionLabel}>{L("Өдрийн даалгавар", "오늘의 과제", "Daily assignment")}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
          <button type="button" aria-label={L("Хасах", "빼기", "Fewer")} style={stepBtn} disabled={busy || goal <= 1} onClick={() => onSave?.({ roundsPerDay: goal - 1 })}>−</button>
          <div style={{ textAlign: "center", minWidth: 64 }}>
            <div style={{ ...displayTitle, fontSize: 36 }}>{goal}</div>
            <div style={{ fontSize: 12, color: BRAND.faint }}>{L("раунд / өдөр", "라운드 / 일", "rounds / day")}</div>
          </div>
          <button type="button" aria-label={L("Нэмэх", "더하기", "More")} style={stepBtn} disabled={busy || goal >= MAX_ROUNDS_PER_DAY} onClick={() => onSave?.({ roundsPerDay: goal + 1 })}>+</button>
        </div>
        <div role="radiogroup" aria-label={L("Дасгал", "드릴", "Drill")} style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          {[{ id: null, name: { mn: "Ямар ч раунд", ko: "아무 라운드", en: "Any round" }, icon: "🥊" }, ...BENCHMARKS].map((b) => {
            const on = (team.drill || null) === b.id;
            return (
              <button key={b.id || "any"} type="button" role="radio" aria-checked={on} disabled={busy}
                onClick={() => !on && onSave?.({ drill: b.id })}
                style={{ ...pill, background: on ? "rgba(255,59,48,0.16)" : "rgba(255,255,255,0.04)", borderColor: on ? "rgba(255,59,48,0.5)" : BRAND.line, color: on ? BRAND.text : BRAND.muted }}>
                {b.icon} {L(b.name.mn, b.name.ko, b.name.en)}
              </button>
            );
          })}
        </div>
      </section>

      {/* Students */}
      <section style={{ ...card, padding: "16px 18px", marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <p style={sectionLabel}>{L("Шавь нар", "제자", "Students")} · {students.length}</p>
          {students.length > 0 && (
            <span style={{ fontSize: 13, color: done === students.length ? UP : BRAND.muted }}>
              {L("Өнөөдөр", "오늘", "Today")} ✓ {done}/{students.length}
            </span>
          )}
        </div>
        {students.length === 0 ? (
          <p style={{ margin: "14px 0 4px", fontSize: 14, color: BRAND.muted }}>
            {L("Одоохондоо шавь алга — кодоо илгээ.", "아직 제자가 없어요 — 코드를 보내세요.", "No students yet — send your code.")}
          </p>
        ) : (
          <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0 }}>
            {students.map((s) => <StudentRow key={s.uid} s={s} L={L} now={now} tz={tzOffsetMin} busy={busy} onRemove={onRemove} />)}
          </ul>
        )}
      </section>
    </div>
  );
}

function Header({ L }) {
  return (
    <header style={{ marginBottom: 16 }}>
      <p style={kickerPill}><span style={kickerDot} />{L("Дасгалжуулагч", "코치", "Coach")}</p>
      <h1 style={{ ...displayTitle, fontSize: 36, marginTop: 12 }}>{L("Миний шавь нар", "내 제자들", "My students")}</h1>
    </header>
  );
}

function StudentRow({ s, L, now, tz, busy, onRemove }) {
  const { summary: m } = s;
  const ago = daysAgo(m.lastAt, now, tz);
  const tone = m.glance ? (m.glance.delta > 0 ? UP : m.glance.delta < 0 ? DOWN : BRAND.muted) : BRAND.muted;
  const initial = (String(s.name).trim()[0] || "?").toUpperCase();
  return (
    <li data-testid="student-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: `1px solid ${BRAND.line}` }}>
      <span aria-hidden="true" style={{ width: 38, height: 38, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0, fontWeight: 800, background: m.doneToday ? "rgba(52,211,153,0.16)" : "rgba(255,255,255,0.06)", color: m.doneToday ? UP : BRAND.text }}>
        {m.doneToday ? "✓" : initial}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: BRAND.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }} aria-label={L(`Өнөөдөр ${m.today}/${m.goal}`, `오늘 ${m.today}/${m.goal}`, `Today ${m.today}/${m.goal}`)}>
          {Array.from({ length: m.goal }, (_, i) => (
            <span key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: i < m.today ? BRAND.red : "rgba(255,255,255,0.12)" }} />
          ))}
          <span style={{ fontSize: 12, color: BRAND.faint, marginLeft: 4 }}>
            {L(`7 хоногт ${m.week}`, `주 ${m.week}`, `${m.week} this week`)}
            {ago != null ? ` · ${ago === 0 ? L("өнөөдөр", "오늘", "today") : L(`${ago} өдрийн өмнө`, `${ago}일 전`, `${ago}d ago`)}` : ""}
          </span>
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ ...displayTitle, fontSize: 22 }}>{m.lastScore != null ? m.lastScore.toFixed(1) : "—"}</div>
        {m.glance && (
          <div style={{ fontSize: 12, fontWeight: 700, color: tone }}>
            {m.glance.delta > 0 ? "▲ +" : m.glance.delta < 0 ? "▼ " : "= "}{m.glance.delta.toFixed(1)}
          </div>
        )}
      </div>
      {onRemove && (
        <button type="button" disabled={busy} aria-label={L(`${s.name}-г хасах`, `${s.name} 제거`, `Remove ${s.name}`)}
          onClick={() => onRemove(s)}
          style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 10, border: `1px solid ${BRAND.line}`, background: "transparent", color: BRAND.faint, fontSize: 18, cursor: "pointer" }}>
          ×
        </button>
      )}
    </li>
  );
}

const wrap = {
  maxWidth: 540,
  margin: "0 auto",
  padding: "calc(24px + env(safe-area-inset-top)) 16px calc(110px + env(safe-area-inset-bottom))",
};
const pill = {
  minHeight: 40, padding: "0 14px", borderRadius: 999, border: `1px solid ${BRAND.line}`,
  background: "rgba(255,255,255,0.05)", color: BRAND.text, fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer",
};
const stepBtn = {
  width: 44, height: 44, borderRadius: 12, border: `1px solid ${BRAND.line}`, background: "rgba(255,255,255,0.05)",
  color: BRAND.text, fontSize: 22, fontWeight: 700, cursor: "pointer",
};
