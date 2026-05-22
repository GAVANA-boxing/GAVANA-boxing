import {
  RED, RED_DARK, GOLD, BG, SURFACE_1, SURFACE_2,
  BORDER, BORDER_2, RADIUS, MOTION,
  redAlpha, goldAlpha, whiteAlpha, blackAlpha, pageBg,
} from "@/lib/tokens";

const s = {
  page: {
    minHeight: "100dvh",
    background: pageBg(0.15),
    color: "#fff",
  },

  // ── Sticky header ─────────────────────────────────────────────────────────
  pageHeader: {
    position: "sticky", top: 0, zIndex: 10,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "calc(14px + env(safe-area-inset-top)) 16px 14px",
    background: blackAlpha(0.92),
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    borderBottom: `1px solid ${BORDER}`,
  },
  kicker: {
    margin: "0 0 2px", fontSize: 9, letterSpacing: "3.5px",
    color: RED, textTransform: "uppercase", fontWeight: 900,
  },
  title: {
    margin: 0, fontSize: "clamp(22px, 7vw, 32px)", fontWeight: 1000, lineHeight: 1,
    letterSpacing: "-0.02em", textTransform: "uppercase",
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
  },
  createBtn: {
    padding: "8px 16px", borderRadius: RADIUS.full,
    border: `1px solid ${redAlpha(0.4)}`, background: redAlpha(0.1),
    color: "#F87171", fontSize: 13, fontWeight: 900, cursor: "pointer",
    flexShrink: 0, transition: `all ${MOTION.fast}`,
  },

  // ── Content shell ─────────────────────────────────────────────────────────
  content: {
    maxWidth: 520, margin: "0 auto",
    padding: "16px 16px calc(90px + env(safe-area-inset-bottom))",
  },

  // ── Create form ───────────────────────────────────────────────────────────
  createForm: {
    background: whiteAlpha(0.03), border: `1px solid ${goldAlpha(0.2)}`,
    borderLeft: `2.5px solid ${GOLD}`, borderRadius: `3px ${RADIUS.lg}px ${RADIUS.lg}px 3px`,
    padding: 16, marginBottom: 18, display: "flex", flexDirection: "column", gap: 10,
    backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
    boxShadow: `0 8px 32px ${blackAlpha(0.3)}`,
  },
  formTitle: { margin: 0, fontSize: 12, fontWeight: 900, color: GOLD, letterSpacing: 1.5, textTransform: "uppercase" },
  formRow: { display: "flex", gap: 8 },
  fieldLabel: { display: "block", fontSize: 10, color: whiteAlpha(0.45), fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 },
  input: {
    width: "100%", boxSizing: "border-box", padding: "11px 13px",
    borderRadius: RADIUS.sm, border: `1px solid ${BORDER}`,
    background: SURFACE_1, color: "#fff", fontSize: 14, outline: "none", colorScheme: "dark",
  },
  textarea: {
    width: "100%", boxSizing: "border-box", padding: "11px 13px",
    borderRadius: RADIUS.sm, border: `1px solid ${BORDER}`,
    background: SURFACE_1, color: "#fff", fontSize: 14, outline: "none",
    resize: "vertical", fontFamily: "inherit",
  },
  select: {
    width: "100%", padding: "11px 13px",
    borderRadius: RADIUS.sm, border: `1px solid ${BORDER}`,
    background: SURFACE_1, color: "#fff", fontSize: 14, outline: "none", colorScheme: "dark",
  },
  submitBtn: {
    width: "100%", padding: 13, borderRadius: RADIUS.sm, border: "none",
    background: `linear-gradient(145deg, ${RED}, ${RED_DARK})`,
    color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer",
    boxShadow: `0 8px 24px ${redAlpha(0.32)}, inset 0 1px 0 ${whiteAlpha(0.1)}`,
  },
  submitBtnDisabled: {
    width: "100%", padding: 13, borderRadius: RADIUS.sm, border: "none",
    background: redAlpha(0.3), color: whiteAlpha(0.5),
    fontSize: 14, fontWeight: 900, cursor: "not-allowed",
  },
  errorText: { margin: 0, fontSize: 12, color: "#F87171" },

  // ── Tabs ──────────────────────────────────────────────────────────────────
  tabs: { display: "flex", gap: 6, marginBottom: 12 },
  tab: {
    flex: 1, padding: "9px 0", borderRadius: RADIUS.sm,
    border: `1px solid ${BORDER_2}`, background: "transparent",
    color: whiteAlpha(0.45), fontSize: 12, fontWeight: 700, cursor: "pointer",
    transition: `all ${MOTION.fast}`,
  },
  tabActive: {
    flex: 1, padding: "9px 0", borderRadius: RADIUS.sm,
    border: `1px solid ${redAlpha(0.5)}`, background: redAlpha(0.12),
    color: "#fff", fontSize: 12, fontWeight: 900, cursor: "pointer",
    boxShadow: `0 0 14px ${redAlpha(0.1)}`,
  },

  // ── Type filter pills ─────────────────────────────────────────────────────
  typeFilters: {
    display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4,
    marginBottom: 14, scrollbarWidth: "none",
  },
  typePill: {
    padding: "5px 12px", borderRadius: RADIUS.full,
    border: `1px solid ${BORDER}`, background: "transparent",
    color: whiteAlpha(0.45), fontSize: 11, fontWeight: 700,
    cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
    transition: `all ${MOTION.fast}`,
  },
  typePillActive: {
    padding: "5px 12px", borderRadius: RADIUS.full,
    border: `1px solid ${goldAlpha(0.4)}`, background: goldAlpha(0.12),
    color: GOLD, fontSize: 11, fontWeight: 700,
    cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
  },

  // ── Event list ────────────────────────────────────────────────────────────
  eventList: { display: "flex", flexDirection: "column", gap: 12 },
  eventCard: {
    background: SURFACE_1, border: `1px solid ${BORDER}`,
    borderLeft: `2.5px solid ${RED}`, borderRadius: `3px ${RADIUS.lg}px ${RADIUS.lg}px 3px`,
    padding: "14px 16px", cursor: "pointer",
    transition: `border-color ${MOTION.fast}, transform ${MOTION.press}`,
    backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
    boxShadow: `0 8px 28px ${blackAlpha(0.35)}`,
  },
  eventCardTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  typeBadge: {
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "3px 10px", borderRadius: RADIUS.full, border: "1px solid",
    fontSize: 10, fontWeight: 900, letterSpacing: 0.3,
  },
  pastBadge: { fontSize: 10, color: whiteAlpha(0.28), fontWeight: 700, letterSpacing: 0.5 },
  liveBadge: {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "3px 10px", borderRadius: RADIUS.full,
    background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.4)",
    color: "#34D399", fontSize: 10, fontWeight: 900, letterSpacing: 1.2,
  },
  liveDot: {
    width: 6, height: 6, borderRadius: "50%",
    background: "#34D399", boxShadow: "0 0 6px #34D399",
    animation: "pulse 1.4s infinite",
  },
  eventTitle: { margin: "0 0 8px", fontSize: 16, fontWeight: 900, lineHeight: 1.25, color: "#fff" },
  eventMeta: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  metaChip: { fontSize: 11, color: whiteAlpha(0.45), fontWeight: 600 },
  eventDesc: { margin: "0 0 10px", fontSize: 12, color: whiteAlpha(0.42), lineHeight: 1.5 },
  eventFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  organizerLabel: { fontSize: 11, color: whiteAlpha(0.3) },
  rsvpBtn: {
    padding: "7px 18px", borderRadius: RADIUS.full, border: "none",
    background: `linear-gradient(145deg, ${RED}, ${RED_DARK})`,
    color: "#fff", fontSize: 12, fontWeight: 900, cursor: "pointer",
    flexShrink: 0, boxShadow: `0 4px 14px ${redAlpha(0.3)}`,
  },
  goingBtn: {
    padding: "7px 18px", borderRadius: RADIUS.full,
    border: "1px solid rgba(52,211,153,0.3)", background: "rgba(52,211,153,0.1)",
    color: "#34D399", fontSize: 12, fontWeight: 900, cursor: "pointer", flexShrink: 0,
  },
  fullBtn: {
    padding: "7px 18px", borderRadius: RADIUS.full,
    border: `1px solid ${BORDER}`, background: "transparent",
    color: whiteAlpha(0.28), fontSize: 12, fontWeight: 700,
    cursor: "not-allowed", flexShrink: 0,
  },
};

export default s;
