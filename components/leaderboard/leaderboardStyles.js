import { RED, redAlpha, GOLD, goldAlpha, BG, pageBg } from "@/lib/tokens";

const styles = {
  page: {
    minHeight: "100dvh",
    background: pageBg(),
    color: "#fff",
    paddingBottom: "calc(88px + env(safe-area-inset-bottom))",
  },
  header: {
    position: "sticky", top: 0, zIndex: 10,
    display: "grid", gridTemplateColumns: "64px 1fr 44px", alignItems: "center", gap: 12,
    padding: "calc(18px + env(safe-area-inset-top)) 16px 18px",
    background: "rgba(11,11,12,0.92)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
    borderBottom: `1px solid ${goldAlpha(0.12)}`,
  },
  backBtn: {
    border: `1px solid ${goldAlpha(0.28)}`, background: "transparent", color: "#fff",
    borderRadius: 12, width: 40, height: 40,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", flexShrink: 0,
  },
  headerCenter: { textAlign: "center" },
  eyebrow: { margin: 0, color: RED, fontSize: 10, fontWeight: 900, letterSpacing: 3, textTransform: "uppercase" },
  title: {
    margin: "3px 0 0", fontSize: 28, fontWeight: 1000, lineHeight: 1,
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
    textTransform: "uppercase", letterSpacing: "-0.02em",
  },
  trophyBadge: { fontSize: 22, textAlign: "right" },

  tabsWrap: {
    background: "rgba(11,11,12,0.92)", position: "sticky", top: 90, zIndex: 9,
    borderBottom: `1px solid ${goldAlpha(0.1)}`, padding: "10px 16px 8px",
    backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
  },
  tabsRow: { display: "flex", gap: 7, maxWidth: 640, margin: "0 auto" },
  tabBtn: {
    flex: 1, padding: "9px 0", borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700, cursor: "pointer",
    transition: "all 0.18s", whiteSpace: "nowrap",
  },
  tabBtnActive: {
    background: goldAlpha(0.14), border: `1px solid ${goldAlpha(0.42)}`,
    color: GOLD, fontWeight: 900, boxShadow: `0 0 14px ${goldAlpha(0.12)}`,
  },
  tabBtnViews: { background: "rgba(96,165,250,0.14)", border: "1px solid rgba(96,165,250,0.42)", color: "#60A5FA" },
  tabBtnLikes: { background: "rgba(244,114,182,0.14)", border: "1px solid rgba(244,114,182,0.42)", color: "#F472B6" },
  seasonLabel: { margin: "6px auto 0", textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.35)", maxWidth: 640, fontWeight: 700 },

  filterWrap: {
    background: "rgba(11,11,12,0.88)", padding: "8px 16px 10px",
    borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 6,
  },
  filterRow: { display: "flex", gap: 6, overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" },
  filterChip: {
    flexShrink: 0, padding: "6px 12px", borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700,
    cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s ease",
  },
  filterChipActiveWeight: { background: "rgba(96,165,250,0.14)", border: "1px solid #60A5FA", color: "#60A5FA" },
  archetypeChip: { flexShrink: 0, width: 20, height: 20, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 },

  content: { maxWidth: 640, margin: "0 auto", padding: "20px 16px" },

  yourRankCard: {
    padding: "16px 18px", borderRadius: 18,
    background: redAlpha(0.1), border: `1.5px solid ${redAlpha(0.42)}`,
    boxShadow: `0 0 0 1px ${redAlpha(0.05)}, 0 8px 28px ${redAlpha(0.12)}, 0 0 40px ${redAlpha(0.06)}`,
    marginBottom: 20, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
  },
  yourRankTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  yourRankLabel: { fontSize: 14, fontWeight: 900, color: "#fff" },
  scorePill: { padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 900, color: "#fff" },
  yourRankSub: { fontSize: 12, color: "rgba(255,255,255,0.42)", lineHeight: 1.4, fontWeight: 600 },

  weeklyChampionBanner: {
    padding: "18px 20px", borderRadius: 20,
    background: `linear-gradient(135deg, ${goldAlpha(0.18)} 0%, ${goldAlpha(0.06)} 100%)`,
    border: `1px solid ${goldAlpha(0.36)}`,
    boxShadow: `0 0 40px ${goldAlpha(0.1)}, inset 0 1px 0 ${goldAlpha(0.18)}`,
    marginBottom: 20, textAlign: "center",
    backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
  },
  weeklyChampionTop: { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 5 },
  weeklyChampionCrown: { fontSize: 20 },
  weeklyChampionTitle: { fontSize: 10, fontWeight: 900, letterSpacing: 2.5, color: GOLD, textTransform: "uppercase" },
  weeklyChampionName: {
    fontSize: 22, fontWeight: 1000, color: "#fff", lineHeight: 1.1,
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
    textTransform: "uppercase", letterSpacing: "-0.01em",
  },
  weeklyChampionScore: { fontSize: 15, color: GOLD, fontWeight: 900, marginTop: 3 },

  sectionHeader: { marginBottom: 16 },
  sectionKicker: { margin: "0 0 4px", color: RED, fontSize: 10, fontWeight: 900, letterSpacing: 3, textTransform: "uppercase" },
  sectionTitle: {
    margin: 0, fontSize: 24, fontWeight: 1000, lineHeight: 1,
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
    textTransform: "uppercase", letterSpacing: "-0.02em",
  },

  loading: { textAlign: "center", color: "rgba(255,255,255,0.45)", padding: 40, fontSize: 14 },
  emptyWrap: { display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 60, paddingBottom: 40, textAlign: "center" },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: "#fff" },
  emptyText: { margin: 0, fontSize: 14, color: "rgba(255,255,255,0.4)", maxWidth: 260, lineHeight: 1.55 },

  list: { display: "grid", gap: 7 },
  row: {
    display: "grid", gridTemplateColumns: "44px 48px 1fr auto", alignItems: "center", gap: 12,
    padding: "14px 14px", borderRadius: 16,
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
    backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
  },
  rowHighlight: {
    background: redAlpha(0.09), border: `1px solid ${redAlpha(0.28)}`,
    boxShadow: `0 4px 20px ${redAlpha(0.08)}`,
  },
  rowFirst: {
    background: `linear-gradient(145deg, ${goldAlpha(0.12)}, ${goldAlpha(0.04)})`,
    border: `1px solid ${goldAlpha(0.28)}`, borderLeft: `3px solid ${GOLD}`,
    borderRadius: "3px 16px 16px 3px", boxShadow: `0 4px 24px ${goldAlpha(0.1)}`,
  },
  rowSecond: {
    background: "linear-gradient(145deg, rgba(156,163,175,0.07), rgba(156,163,175,0.02))",
    border: "1px solid rgba(156,163,175,0.18)", borderLeft: "3px solid #9CA3AF",
    borderRadius: "3px 16px 16px 3px",
  },
  rowThird: {
    background: "linear-gradient(145deg, rgba(251,146,60,0.07), rgba(251,146,60,0.02))",
    border: "1px solid rgba(251,146,60,0.18)", borderLeft: "3px solid #FB923C",
    borderRadius: "3px 16px 16px 3px",
  },
  rankWrap: { display: "flex", alignItems: "center", justifyContent: "center" },
  medal: { fontSize: 22, lineHeight: 1 },
  rankNum: { fontSize: 13, fontWeight: 900, color: "rgba(255,255,255,0.35)" },
  avatar: {
    width: 44, height: 44, borderRadius: "50%",
    background: redAlpha(0.2), border: `1.5px solid ${redAlpha(0.28)}`,
    overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  avatarInitial: { fontSize: 18, fontWeight: 900, color: "#fff" },
  nameBlock: { minWidth: 0 },
  displayName: { fontSize: 14, fontWeight: 800, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  youTag: { fontSize: 9, fontWeight: 900, letterSpacing: 1, color: RED, verticalAlign: "middle" },
  username: { fontSize: 11, color: "rgba(255,255,255,0.32)", marginTop: 1 },
  scoresBlock: { textAlign: "right", flexShrink: 0 },
  bestScore: { fontSize: 18, fontWeight: 900, lineHeight: 1.1 },
  latestScore: { fontSize: 10, color: "rgba(255,255,255,0.32)", marginTop: 2 },
  entryRankRow: { display: "flex", alignItems: "center", gap: 4, marginTop: 3 },
  sessionsBadge: { fontSize: 10, color: "rgba(255,255,255,0.28)" },
  allTimeRankBadge: { fontSize: 10, color: "#60A5FA" },
  badgeRow: { display: "flex", gap: 4, marginTop: 5, flexWrap: "wrap" },
  badge: { display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 7px", borderRadius: 999, border: "1px solid", fontSize: 10, fontWeight: 800, letterSpacing: 0.2, whiteSpace: "nowrap" },
};

export default styles;
