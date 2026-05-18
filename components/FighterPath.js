"use client";

const STEPS = [
  {
    id: "profile",
    icon: "👤",
    label: "Fighter Profile",
    desc: "Зураг, bio нэмэх",
    check: (d) => !!(d.photoURL && d.bio),
    cta: "Profile засах",
    link: "profile/edit",
  },
  {
    id: "upload",
    icon: "🎬",
    label: "Анхны Reel",
    desc: "Эхний training reel upload хийх",
    check: (d) => (d.reelsCount || 0) > 0,
    cta: "Reel upload",
    link: "upload",
  },
  {
    id: "ai",
    icon: "🤖",
    label: "AI дүн авах",
    desc: "Challenge хийж AI техник шинжилгээ авах",
    check: (d) => (d.challengesCount || 0) > 0,
    cta: "Train хийх",
    link: "train",
  },
  {
    id: "streak",
    icon: "🔥",
    label: "3 өдрийн streak",
    desc: "3 өдөр дараалан training хийх",
    check: (d) => (d.streakDays || 0) >= 3,
    cta: "Train хийх",
    link: "train",
  },
  {
    id: "coach",
    icon: "🎯",
    label: "Coach олох",
    desc: "Өөртөө тохирсон coach-той холбогдох",
    check: (d) => !!(d.coachId || d.hasCoach),
    cta: "Coach хайх",
    link: "coach",
  },
  {
    id: "sparring",
    icon: "🥊",
    label: "Sparring partner",
    desc: "Тулах хүн олох",
    check: (d) => !!(d.hasSparringPartner),
    cta: "Sparring хайх",
    link: "sparring",
  },
];

export default function FighterPath({ pathData = {}, locale = "en", router }) {
  const completedCount = STEPS.filter((s) => s.check(pathData)).length;
  const nextStep = STEPS.find((s) => !s.check(pathData));
  const pct = Math.round((completedCount / STEPS.length) * 100);

  return (
    <div style={fp.wrap}>
      {/* Header */}
      <div style={fp.header}>
        <div style={fp.left}>
          <div style={fp.dot} />
          <span style={fp.label}>FIGHTER PATH</span>
        </div>
        <span style={fp.pctBadge}>{pct}%</span>
      </div>

      {/* Progress */}
      <div style={{ padding: "8px 14px 14px" }}>
        <div style={fp.track}>
          <div style={{ ...fp.fill, width: `${pct}%` }} />
        </div>
        <div style={fp.sub}>{completedCount} / {STEPS.length} алхам дууссан</div>
      </div>

      {/* Steps */}
      <div style={fp.stepList}>
        {STEPS.map((step) => {
          const done = step.check(pathData);
          const isNext = !done && step.id === nextStep?.id;
          return (
            <div
              key={step.id}
              style={{
                ...fp.step,
                ...(isNext ? fp.stepHighlight : {}),
                ...(done ? fp.stepDone : {}),
              }}
            >
              <div style={{
                ...fp.stepIcon,
                ...(done ? fp.iconDone : isNext ? fp.iconActive : fp.iconIdle),
              }}>
                {done ? "✓" : step.icon}
              </div>

              <div style={fp.stepBody}>
                <div style={{
                  ...fp.stepLabel,
                  ...(done ? fp.labelDone : isNext ? fp.labelActive : fp.labelIdle),
                }}>
                  {step.label}
                </div>
                {!done && <div style={fp.stepDesc}>{step.desc}</div>}
              </div>

              {isNext && !step.soon && step.link && (
                <button
                  type="button"
                  onClick={() => router?.push(`/${locale}/${step.link}`)}
                  style={fp.ctaBtn}
                >
                  {step.cta} →
                </button>
              )}
              {step.soon && (
                <span style={fp.soonTag}>Soon</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const fp = {
  wrap: {
    background: "linear-gradient(145deg, #111012 0%, #0a0a0a 100%)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderLeft: "2.5px solid #D4AF37",
    borderRadius: "3px 16px 16px 3px",
    boxShadow: "0 0 0 1px rgba(0,0,0,0.4), 0 12px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.025)",
    overflow: "hidden",
    marginBottom: 28,
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "10px 14px 0",
  },
  left: { display: "flex", alignItems: "center", gap: 8 },
  dot: {
    width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
    background: GOLD,
    boxShadow: "0 0 7px #D4AF37, 0 0 14px #D4AF3755",
  },
  label: {
    fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.5)",
    letterSpacing: "0.2em", textTransform: "uppercase",
  },
  pctBadge: {
    fontSize: 11, fontWeight: 900, color: GOLD,
    background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)",
    borderRadius: 999, padding: "2px 10px",
  },
  track: {
    height: 3, borderRadius: 999, background: "rgba(255,255,255,0.07)",
    overflow: "hidden", marginBottom: 5,
  },
  fill: {
    height: "100%", borderRadius: 999,
    background: "linear-gradient(90deg, #C1121F, #D4AF37)",
    transition: "width 700ms cubic-bezier(0.4,0,0.2,1)",
  },
  sub: {
    fontSize: 10, color: "rgba(255,255,255,0.28)", fontWeight: 700, letterSpacing: 0.4,
  },
  stepList: { borderTop: "1px solid rgba(255,255,255,0.045)" },
  step: {
    display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.03)",
  },
  stepHighlight: {
    background: "rgba(193,18,31,0.05)",
    borderBottom: "1px solid rgba(193,18,31,0.08)",
  },
  stepDone: { opacity: 0.5 },
  stepIcon: {
    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
  },
  iconDone: {
    background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)",
    color: "#34D399", fontSize: 12, fontWeight: 900,
  },
  iconActive: {
    background: "rgba(193,18,31,0.15)", border: "1px solid rgba(193,18,31,0.38)",
    color: "#fff",
  },
  iconIdle: {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
    color: "rgba(255,255,255,0.28)",
  },
  stepBody: { flex: 1, minWidth: 0 },
  stepLabel: { fontSize: 13, fontWeight: 800, lineHeight: 1.25 },
  labelActive: { color: "#fff" },
  labelDone: { color: "rgba(255,255,255,0.5)", textDecoration: "line-through" },
  labelIdle: { color: "rgba(255,255,255,0.35)" },
  stepDesc: { fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 2 },
  ctaBtn: {
    flexShrink: 0, padding: "6px 12px", borderRadius: 999, border: "none",
    background: "linear-gradient(135deg, #C1121F, #8f0d17)",
    color: "#fff", fontSize: 11, fontWeight: 900, cursor: "pointer",
    boxShadow: "0 2px 10px rgba(193,18,31,0.3)",
    whiteSpace: "nowrap",
  },
  soonTag: {
    flexShrink: 0, padding: "3px 9px", borderRadius: 999,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.22)", fontSize: 10, fontWeight: 700,
  },
};
