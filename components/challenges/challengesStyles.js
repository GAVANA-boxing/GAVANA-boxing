import { RED, redAlpha, goldAlpha, GOLD, BG, pageBg } from "@/lib/tokens";

const styles = {
  page: {
    minHeight: "100dvh",
    background: pageBg(0.16),
    color: "#fff",
    padding: "calc(28px + env(safe-area-inset-top)) 16px calc(92px + env(safe-area-inset-bottom))",
  },
  backBtn: {
    width: 40, height: 40,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", padding: 0, color: "#fff", justifySelf: "start",
    backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
  },
  loading: {
    minHeight: "100dvh", background: BG, color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  shell: { maxWidth: 540, margin: "0 auto", display: "grid", gap: 14 },
  header: { display: "grid", gap: 6 },
  kicker: {
    margin: 0, color: RED, fontSize: 10, fontWeight: 900,
    letterSpacing: 3, textTransform: "uppercase",
  },
  title: {
    margin: 0,
    fontSize: "clamp(34px, 10vw, 42px)",
    lineHeight: 0.95,
    fontWeight: 1000,
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
    textTransform: "uppercase",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    margin: 0, color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.5,
  },
  streakPill: {
    width: "fit-content", display: "inline-flex", alignItems: "center", gap: 8,
    minHeight: 34, padding: "0 12px", borderRadius: 999,
    background: "rgba(251,146,60,0.12)", border: "1px solid rgba(251,146,60,0.28)",
    color: "#FED7AA", fontSize: 13, fontWeight: 900,
  },
  streakFlame: { fontSize: 16, lineHeight: 1 },

  // ── Main tabs ──
  seasonTabRow: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, padding: 4,
    borderRadius: 14, background: "rgba(0,0,0,0.48)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
  },
  seasonTab: {
    minHeight: 36, border: "1px solid transparent", borderRadius: 10,
    background: "transparent", color: "rgba(255,255,255,0.38)",
    fontSize: 12, fontWeight: 900, cursor: "pointer",
    transition: "all 180ms",
  },
  seasonTabActive: {
    background: `linear-gradient(135deg, ${redAlpha(0.9)}, ${goldAlpha(0.2)})`,
    color: "#fff",
    boxShadow: `0 8px 24px ${redAlpha(0.2)}`,
    border: `1px solid ${redAlpha(0.5)}`,
  },
  seasonLabel: { textAlign: "center", paddingBottom: 2 },
  seasonLabelText: { fontSize: 11, color: "rgba(255,255,255,0.38)", fontWeight: 700, letterSpacing: 0.4 },

  // ── Champion banner ──
  champBanner: {
    padding: "16px 18px", borderRadius: 20,
    background: `linear-gradient(135deg, ${goldAlpha(0.18)}, rgba(11,11,11,0.92))`,
    border: `1px solid ${goldAlpha(0.32)}`,
    boxShadow: `0 8px 32px ${goldAlpha(0.1)}, inset 0 1px 0 ${goldAlpha(0.18)}`,
    display: "grid", gap: 10,
    backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
  },
  champBannerTitle: {
    margin: 0, color: GOLD, fontSize: 10, fontWeight: 900,
    letterSpacing: 2.5, textTransform: "uppercase",
  },
  champList: { display: "grid", gap: 8 },
  champItem: { display: "flex", alignItems: "center", gap: 10 },
  champBadge: { fontSize: 20, flexShrink: 0, lineHeight: 1 },
  champInfo: { display: "grid", gap: 2, flex: 1, minWidth: 0 },
  champName: {
    fontSize: 14, fontWeight: 900, color: "#fff",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  champChallenge: { fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700 },
  champScore: { fontSize: 15, fontWeight: 1000, color: GOLD, flexShrink: 0 },

  // ── Your rank bar ──
  yourRankBar: {
    position: "sticky", top: "calc(62px + env(safe-area-inset-top))", zIndex: 7,
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
    minHeight: 46, padding: "0 16px", borderRadius: 16,
    background: `linear-gradient(135deg, ${goldAlpha(0.14)}, rgba(10,10,10,0.82))`,
    border: `1px solid ${goldAlpha(0.24)}`,
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    boxShadow: `0 14px 36px rgba(0,0,0,0.3), 0 0 24px ${goldAlpha(0.06)}`,
  },
  yourRankLabel: { color: "#fff", fontSize: 14, fontWeight: 1000 },
  yourRankChallenge: {
    minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
    color: GOLD, fontSize: 12, fontWeight: 900,
  },

  // ── Challenge cards ──
  challengeList: { display: "grid", gap: 14 },
  card: {
    borderRadius: 22, padding: "18px 16px 16px",
    background: "rgba(255,255,255,0.025)",
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderLeft: `3px solid ${RED}`,
    borderRadius: "4px 22px 22px 4px",
    boxShadow: `0 0 0 0.5px rgba(0,0,0,0.5) inset, 0 20px 52px rgba(0,0,0,0.28), 0 0 24px ${redAlpha(0.04)}`,
  },
  cardTop: {
    display: "flex", alignItems: "flex-start",
    justifyContent: "space-between", gap: 12,
  },
  cardTitleGroup: { flex: 1, minWidth: 0 },
  cardTitle: {
    margin: 0, color: "#fff", fontSize: 18, fontWeight: 1000,
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
    textTransform: "uppercase", letterSpacing: "-0.01em",
  },
  cardDesc: {
    margin: "5px 0 0", color: "rgba(255,255,255,0.48)",
    fontSize: 12, lineHeight: 1.45,
  },
  startButton: {
    flexShrink: 0, padding: "10px 18px", border: "none", borderRadius: 12,
    background: `linear-gradient(145deg, ${RED}, #cc2820)`,
    boxShadow: `0 6px 22px ${redAlpha(0.35)}, inset 0 1px 0 rgba(255,255,255,0.12)`,
    color: "#fff", fontSize: 12, fontWeight: 1000, whiteSpace: "nowrap",
    cursor: "pointer", letterSpacing: 1, textTransform: "uppercase",
  },

  // ── Leaderboard inside card ──
  leaderboard: { marginTop: 16, display: "grid", gap: 8 },
  leaderboardTitle: {
    margin: 0, color: RED, fontSize: 10, fontWeight: 900,
    letterSpacing: 3, textTransform: "uppercase",
  },
  scoreRows: { display: "grid", gap: 6 },
  scoreRow: {
    minHeight: 60, display: "grid", gridTemplateColumns: "42px minmax(0, 1fr) auto",
    alignItems: "center", gap: 10, padding: "9px 12px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
  },
  scoreRowCurrent: {
    background: goldAlpha(0.13),
    borderColor: goldAlpha(0.36),
    boxShadow: `0 0 0 1px ${goldAlpha(0.08)}, 0 12px 28px ${goldAlpha(0.1)}`,
  },
  emptyLeaderboard: {
    padding: "14px 12px", borderRadius: 12,
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 800, textAlign: "center",
  },
  rankNum: { color: GOLD, fontSize: 18, fontWeight: 950, textAlign: "center" },
  fighterCell: { minWidth: 0, display: "flex", alignItems: "center", gap: 9 },
  avatar: {
    width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center",
    flexShrink: 0, overflow: "hidden",
    background: redAlpha(0.22), border: `1px solid ${goldAlpha(0.22)}`,
    color: "#fff", fontSize: 11, fontWeight: 900,
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  fighterText: { minWidth: 0, display: "grid", gap: 2 },
  fighterName: {
    minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
    color: "rgba(255,255,255,0.82)", fontSize: 13, fontWeight: 800,
  },
  resultMeta: { color: "rgba(255,255,255,0.42)", fontSize: 11, fontWeight: 800 },
  scoreStack: { display: "grid", justifyItems: "end", gap: 3 },
  scoreValue: {
    color: "#fff", fontSize: 16, fontWeight: 1000,
    textShadow: `0 0 18px ${goldAlpha(0.3)}`,
  },
  xpValue: { color: GOLD, fontSize: 11, fontWeight: 900 },
};

export default styles;
