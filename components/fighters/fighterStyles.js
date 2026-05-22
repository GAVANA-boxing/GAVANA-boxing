import { RED, redAlpha, BORDER, BORDER_2, RADIUS, whiteAlpha, blackAlpha } from "@/lib/tokens";

const s = {
  page: {
    minHeight: "100dvh",
    color: "#fff",
    paddingBottom: "calc(88px + env(safe-area-inset-bottom))",
    position: "relative",
  },

  hero: { position: "relative", paddingBottom: 0, overflow: "hidden" },
  heroPortraitWrap: { position: "relative", width: "100%" },
  heroPortraitFade: { position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 },
  heroTopBar: { position: "absolute", top: 0, left: 0, right: 0, height: 2, zIndex: 5 },
  backPill: {
    display: "inline-flex", alignItems: "center", gap: 4,
    background: blackAlpha(0.5), backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
    border: `1px solid ${whiteAlpha(0.12)}`, color: whiteAlpha(0.85),
    fontSize: 12, padding: "7px 16px", borderRadius: 20, cursor: "pointer",
    position: "absolute", top: "calc(12px + env(safe-area-inset-top))", left: 12, zIndex: 10,
  },
  heroCenter: {
    display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
    padding: "0 20px 16px", position: "relative", zIndex: 2,
  },
  heroKicker: { margin: "0 0 16px", fontSize: 10, fontWeight: 900, letterSpacing: 3, color: RED, textTransform: "uppercase" },
  heroFlagDisplay: { position: "relative", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  heroFlagBig: {
    fontSize: 72, lineHeight: 1,
    filter: `drop-shadow(0 8px 24px ${blackAlpha(0.7)}) drop-shadow(0 0 30px ${whiteAlpha(0.05)})`,
  },
  heroNameBig: {
    margin: "0 0 6px", fontSize: "clamp(40px, 12vw, 68px)",
    fontFamily: "var(--font-display, 'Anton', sans-serif)", fontWeight: 400,
    letterSpacing: "0.03em", lineHeight: 0.88, color: "#fff", textTransform: "uppercase",
    filter: `drop-shadow(0 2px 0 ${blackAlpha(0.8)})`,
  },
  heroNickname: { margin: "0 0 16px", fontSize: 13, color: whiteAlpha(0.38), fontStyle: "italic", fontWeight: 400 },
  heroMeta: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center" },
  heroStyleBadge: { display: "inline-block", border: "1px solid", borderRadius: 20, padding: "4px 13px", fontSize: 9, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase" },
  heroWeightClass: { fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: whiteAlpha(0.28) },
  heroIdentity: { margin: "0 20px 12px", fontSize: 13, color: whiteAlpha(0.55), lineHeight: 1.65, fontWeight: 400, textAlign: "center", position: "relative", zIndex: 2 },
  heroWeapon: { display: "flex", alignItems: "center", gap: 7, margin: "0 16px 18px", padding: "0 0 4px" },
  heroWeaponDot: { fontSize: 14, opacity: 0.7 },
  heroWeaponText: { fontSize: 12, fontWeight: 700, letterSpacing: 0.1 },
  heroAccentLine: { height: 1, marginTop: 0, opacity: 0.6 },

  content: { padding: "18px 14px", display: "flex", flexDirection: "column", gap: 10 },

  section: {
    background: whiteAlpha(0.03), backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    border: `1px solid ${whiteAlpha(0.07)}`, borderLeft: "2.5px solid",
    borderRadius: `3px ${RADIUS.lg}px ${RADIUS.lg}px 3px`, overflow: "hidden",
    transition: "border-color 220ms ease, box-shadow 220ms ease",
    boxShadow: `0 8px 28px ${blackAlpha(0.25)}`,
  },
  sectionBtn: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 16px", border: "none", background: "transparent", cursor: "pointer" },
  sectionTitle: { margin: 0, fontSize: 10, fontWeight: 900, letterSpacing: 1.8, textTransform: "uppercase", transition: "color 220ms ease" },
  chevron: { width: 16, height: 16, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", flexShrink: 0, transition: "transform 220ms ease, color 220ms ease", opacity: 0.5 },
  sectionBody: { padding: "0 16px 16px" },

  pillGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 },
  stylePill: {
    display: "flex", flexDirection: "column", gap: 6, border: "1px solid", borderRadius: 13,
    padding: "12px 11px", fontSize: 12, color: whiteAlpha(0.85), lineHeight: 1.4,
    background: whiteAlpha(0.02), position: "relative", overflow: "hidden",
  },
  pillIcon: { fontSize: 18, lineHeight: 1 },
  pillDot: { width: 6, height: 6, borderRadius: "50%", flexShrink: 0, marginTop: 4 },

  comboCard: {
    background: whiteAlpha(0.03), backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
    border: `1px solid ${BORDER_2}`, borderRadius: RADIUS.md, padding: "12px 14px",
    marginBottom: 8, boxShadow: `0 4px 20px ${blackAlpha(0.28)}`,
  },
  comboName: { margin: "0 0 8px", fontSize: 10, fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase" },
  comboSteps: { display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" },
  comboStepWrap: { display: "inline-flex", alignItems: "center", gap: 5 },
  comboStep: { background: whiteAlpha(0.07), border: `1px solid ${whiteAlpha(0.12)}`, borderRadius: 8, padding: "5px 11px", fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: 0.1 },
  comboArrow: { color: RED, fontSize: 14, fontWeight: 900, textShadow: `0 0 8px ${redAlpha(0.9)}` },

  dnaBox: { border: "1px solid", borderRadius: RADIUS.sm, padding: "12px", overflow: "hidden" },
  dnaHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  dnaType: { fontSize: 15, fontWeight: 900, letterSpacing: -0.3, lineHeight: 1.1 },
  dnaTags: { display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "flex-end", maxWidth: "55%" },
  dnaTag: { border: "1px solid", borderBottom: "2px solid", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700, textTransform: "lowercase", letterSpacing: 0.2 },
  dnaDesc: { margin: 0, fontSize: 12, color: whiteAlpha(0.62), lineHeight: 1.55 },

  numRow: { display: "flex", alignItems: "flex-start", gap: 9, marginBottom: 7 },
  numBadge: { width: 18, height: 18, borderRadius: "50%", fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 },
  dotRow: { display: "flex", alignItems: "flex-start", gap: 9, marginBottom: 7 },
  dotMark: { width: 5, height: 5, borderRadius: "50%", flexShrink: 0, marginTop: 6 },
  rowText: { fontSize: 13, color: whiteAlpha(0.78), lineHeight: 1.45 },

  drillRow: {
    display: "flex", alignItems: "flex-start", gap: 9, marginBottom: 7,
    background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.1)",
    borderRadius: RADIUS.sm, padding: "9px 10px", transition: "background 180ms ease, box-shadow 180ms ease",
  },
  drillNum: { width: 18, height: 18, borderRadius: "50%", background: "rgba(16,185,129,0.18)", color: "#10B981", fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  drillText: { fontSize: 12, color: whiteAlpha(0.72), lineHeight: 1.45 },

  fightRow: { paddingBottom: 10, marginBottom: 4, borderBottom: `1px solid ${BORDER}` },
  fightMeta: { display: "flex", justifyContent: "space-between", marginBottom: 3 },
  fightName: { fontSize: 13, fontWeight: 700, color: "#fff" },
  fightYear: { fontSize: 11, color: whiteAlpha(0.35) },
  fightNote: { margin: 0, fontSize: 12, color: whiteAlpha(0.45), lineHeight: 1.4 },

  tagsBlock: { marginTop: 2 },
  tagsLabel: { margin: "0 0 6px", fontSize: 9, color: whiteAlpha(0.28), textTransform: "uppercase", letterSpacing: 1.5 },
  tagsRow: { display: "flex", flexWrap: "wrap", gap: 5 },
  tagChip: { background: "none", border: `1px solid ${BORDER_2}`, borderRadius: 20, padding: "3px 10px", fontSize: 10, color: whiteAlpha(0.3), letterSpacing: 0.2 },

  allBtn: {
    width: "100%", padding: "14px", background: "none", border: "none",
    borderTop: `1px solid ${whiteAlpha(0.05)}`, borderRadius: 0,
    color: whiteAlpha(0.25), fontSize: 12, cursor: "pointer", textAlign: "center", marginTop: 8,
  },

  notFound: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 4 },
  backBtn: {
    marginTop: 16, padding: "9px 18px", background: whiteAlpha(0.05),
    border: `1px solid ${whiteAlpha(0.1)}`, borderRadius: 20, color: whiteAlpha(0.65), fontSize: 12, cursor: "pointer",
  },
};

export default s;
