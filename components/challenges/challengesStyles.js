import { RED, RED_DARK, redAlpha, goldAlpha, GOLD, BG, RADIUS, whiteAlpha, blackAlpha, pageBg } from "@/lib/tokens";

const styles = {
  page: {
    minHeight: "100dvh",
    background: pageBg(0.16),
    color: "#fff",
    padding: "calc(28px + env(safe-area-inset-top)) 16px calc(92px + env(safe-area-inset-bottom))",
  },
  backBtn: {
    width: 40, height: 40,
    border: `1px solid ${whiteAlpha(0.09)}`,
    background: blackAlpha(0.4),
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

  // ── Header ──
  header: { display: "grid", gap: 6, paddingBottom: 2 },
  kicker: {
    margin: 0, color: redAlpha(0.7), fontSize: 9, fontWeight: 900,
    letterSpacing: 3.5, textTransform: "uppercase",
  },
  title: {
    margin: 0,
    fontSize: "clamp(30px, 9vw, 38px)",
    lineHeight: 0.95,
    fontWeight: 1000,
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
    textTransform: "uppercase",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    margin: 0, color: whiteAlpha(0.38), fontSize: 12, lineHeight: 1.5,
  },
  streakPill: {
    width: "fit-content", display: "inline-flex", alignItems: "center", gap: 6,
    minHeight: 28, padding: "0 10px", borderRadius: RADIUS.full,
    background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.2)",
    color: "rgba(253,186,116,0.8)", fontSize: 11, fontWeight: 800,
  },
  streakFlame: { fontSize: 13, lineHeight: 1 },

  // ── Main tabs ──
  mainTabRow: {
    display: "flex", gap: 0, padding: 3,
    borderRadius: 14, background: blackAlpha(0.4),
    border: `1px solid ${whiteAlpha(0.07)}`,
    backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
  },
  mainTab: {
    flex: 1, minHeight: 38, border: "none", borderRadius: 11,
    background: "transparent", color: whiteAlpha(0.35),
    fontSize: 12, fontWeight: 800, cursor: "pointer",
    transition: "all 180ms", letterSpacing: 0.3,
  },
  mainTabActive: {
    background: whiteAlpha(0.07),
    color: "#fff",
    boxShadow: `0 2px 8px ${blackAlpha(0.3)}`,
  },

  // ── Season tabs ──
  seasonTabRow: {
    display: "flex", gap: 0, padding: 3,
    borderRadius: 12, background: blackAlpha(0.35),
    border: `1px solid ${whiteAlpha(0.06)}`,
    backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
    width: "fit-content",
  },
  seasonTab: {
    minHeight: 30, minWidth: 80, border: "none", borderRadius: 9,
    background: "transparent", color: whiteAlpha(0.35),
    fontSize: 11, fontWeight: 800, cursor: "pointer",
    transition: "all 180ms", padding: "0 12px",
  },
  seasonTabActive: {
    background: whiteAlpha(0.09),
    color: "#fff",
  },

  // ── Champion banner ──
  champBanner: {
    padding: "14px 16px", borderRadius: 16,
    background: goldAlpha(0.05),
    border: `1px solid ${goldAlpha(0.15)}`,
    display: "grid", gap: 10,
  },
  champBannerTitle: {
    margin: 0, color: goldAlpha(0.5), fontSize: 9, fontWeight: 900,
    letterSpacing: 2.5, textTransform: "uppercase",
  },
  champList: { display: "grid", gap: 7 },
  champItem: { display: "flex", alignItems: "center", gap: 10 },
  champBadge: { fontSize: 18, flexShrink: 0, lineHeight: 1 },
  champInfo: { display: "grid", gap: 2, flex: 1, minWidth: 0 },
  champName: {
    fontSize: 13, fontWeight: 900, color: "#fff",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  champChallenge: { fontSize: 10, color: whiteAlpha(0.35), fontWeight: 700 },
  champScore: { fontSize: 14, fontWeight: 1000, color: GOLD, flexShrink: 0 },

  // ── Your rank bar ──
  yourRankBar: {
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
    minHeight: 52, padding: "0 16px", borderRadius: 14,
    background: whiteAlpha(0.04),
    border: `1px solid ${whiteAlpha(0.07)}`,
    borderLeft: `3px solid ${whiteAlpha(0.12)}`,
  },
  yourRankBarGold: {
    background: goldAlpha(0.07),
    border: `1px solid ${goldAlpha(0.22)}`,
    borderLeft: `3px solid ${goldAlpha(0.7)}`,
  },
  yourRankBarRed: {
    background: "rgba(239,68,68,0.06)",
    border: "1px solid rgba(239,68,68,0.18)",
    borderLeft: "3px solid rgba(239,68,68,0.7)",
  },
  yourRankLabel: { color: whiteAlpha(0.65), fontSize: 12, fontWeight: 700 },
  yourRankLabelGold: { color: GOLD, fontSize: 13, fontWeight: 900 },
  yourRankLabelRed: { color: "#F87171", fontSize: 12, fontWeight: 900, letterSpacing: 0.3 },
  yourRankSubLabel: { color: "rgba(248,113,113,0.55)", fontSize: 10, fontWeight: 600, marginTop: 2 },
  yourRankChallenge: {
    minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
    color: goldAlpha(0.7), fontSize: 11, fontWeight: 800,
  },

  // ── Countdown banner ──
  countdownBanner: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    minHeight: 36, padding: "0 16px", borderRadius: 12,
    background: "rgba(245,196,81,0.08)",
    border: "1px solid rgba(245,196,81,0.22)",
    textAlign: "center",
  },
  countdownBannerUrgent: {
    background: "rgba(239,68,68,0.09)",
    border: "1px solid rgba(239,68,68,0.28)",
  },
  countdownLabel: {
    fontSize: 9, fontWeight: 900, letterSpacing: 1.8, textTransform: "uppercase",
    color: "rgba(245,196,81,0.6)",
  },
  countdownLabelUrgent: { color: "rgba(248,113,113,0.7)" },
  countdownValue: {
    fontSize: 13, fontWeight: 900, letterSpacing: 1, color: "rgba(245,196,81,0.9)",
    fontVariantNumeric: "tabular-nums",
  },
  countdownValueUrgent: { color: "#F87171" },

  // ── Challenge cards ──
  challengeList: { display: "grid", gap: 14 },
  card: {
    borderRadius: 20,
    overflow: "hidden",
    background: "rgba(18,18,22,0.85)",
    backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
    border: `1px solid ${whiteAlpha(0.08)}`,
    boxShadow: `0 8px 32px ${blackAlpha(0.28)}`,
  },

  // Card top section
  cardHeader: {
    padding: "18px 16px 16px",
    display: "flex", alignItems: "flex-start",
    justifyContent: "space-between", gap: 14,
  },
  cardLeft: { display: "flex", alignItems: "flex-start", gap: 12, flex: 1, minWidth: 0 },
  cardEmojiBadge: {
    width: 46, height: 46, borderRadius: 14, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 24, lineHeight: 1,
    background: whiteAlpha(0.06),
    border: `1px solid ${whiteAlpha(0.1)}`,
  },
  cardTitleGroup: { flex: 1, minWidth: 0, paddingTop: 2 },
  cardTitle: {
    margin: 0, color: "#fff", fontSize: 15, fontWeight: 900,
    letterSpacing: "-0.01em", lineHeight: 1.15,
  },
  cardDesc: {
    margin: "4px 0 0", color: whiteAlpha(0.35),
    fontSize: 11, lineHeight: 1.4,
  },
  startButton: {
    flexShrink: 0, padding: "9px 16px", border: "none", borderRadius: 100,
    background: `linear-gradient(135deg, ${RED}, ${RED_DARK})`,
    boxShadow: `0 4px 14px ${redAlpha(0.35)}`,
    color: "#fff", fontSize: 10, fontWeight: 900, whiteSpace: "nowrap",
    cursor: "pointer", letterSpacing: 1, textTransform: "uppercase",
    marginTop: 2,
  },

  // Divider between card header and leaderboard
  cardDivider: {
    height: 1,
    background: whiteAlpha(0.06),
    margin: "0",
  },

  // Leaderboard section inside card
  scoreRows: { display: "grid", gap: 0 },
  scoreRow: {
    minHeight: 52, display: "flex", alignItems: "center", gap: 10,
    padding: "10px 16px",
    borderBottom: `1px solid ${whiteAlpha(0.04)}`,
  },
  scoreRowLast: {
    borderBottom: "none",
  },
  scoreRowCurrent: {
    background: goldAlpha(0.06),
  },
  emptyLeaderboard: {
    padding: "16px 16px",
    color: whiteAlpha(0.28), fontSize: 12, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
  },
  emptyUndefeated: {
    fontSize: 11, fontWeight: 900, letterSpacing: 0.8, textTransform: "uppercase",
    color: "rgba(248,113,113,0.7)",
  },
  emptyNoChallengers: {
    fontSize: 11, fontWeight: 600, color: whiteAlpha(0.35), marginTop: 2,
  },

  // Rank accent bars for top 3
  scoreRowRank1: { borderLeft: "3px solid rgba(255,200,0,0.75)", background: "rgba(255,200,0,0.04)" },
  scoreRowRank2: { borderLeft: "3px solid rgba(192,192,192,0.6)", background: "rgba(192,192,192,0.03)" },
  scoreRowRank3: { borderLeft: "3px solid rgba(205,127,50,0.55)", background: "rgba(205,127,50,0.03)" },

  // Rank indicators
  rankMedal: { fontSize: 17, minWidth: 24, textAlign: "center", flexShrink: 0, lineHeight: 1 },
  rankNum: {
    color: whiteAlpha(0.3), fontSize: 12, fontWeight: 900, textAlign: "center",
    minWidth: 24, flexShrink: 0,
  },

  // Fighter row
  fighterCell: { flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 10 },
  avatar: {
    width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, overflow: "hidden",
    background: `linear-gradient(135deg, ${redAlpha(0.35)}, ${redAlpha(0.15)})`,
    border: `1px solid ${whiteAlpha(0.12)}`,
    color: "#fff", fontSize: 11, fontWeight: 900,
  },
  avatarCurrent: {
    background: `linear-gradient(135deg, ${goldAlpha(0.4)}, ${goldAlpha(0.2)})`,
    border: `1px solid ${goldAlpha(0.35)}`,
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover", display: "block", borderRadius: "50%" },
  fighterName: {
    minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
    color: whiteAlpha(0.8), fontSize: 13, fontWeight: 700,
  },
  fighterNameCurrent: { color: "#fff", fontWeight: 900 },

  // Score display
  scoreStack: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0 },
  scoreValue: { color: "#fff", fontSize: 15, fontWeight: 900, letterSpacing: "-0.01em" },
  scoreValueCurrent: { color: GOLD },
  xpValue: { color: goldAlpha(0.55), fontSize: 10, fontWeight: 700 },
};

export default styles;
