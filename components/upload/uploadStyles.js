import {
  RED, RED_DARK, GOLD, BG, SURFACE_1, SURFACE, SURFACE_2,
  BORDER, BORDER_2, MUTED, SP, RADIUS, MOTION,
  redAlpha, goldAlpha, whiteAlpha, blackAlpha, pageBg,
} from "@/lib/tokens";

const S = {
  loading: { minHeight: "100dvh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" },

  // ── Video step
  videoPage: { minHeight: "100dvh", background: "#000", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" },
  videoHeader: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "calc(16px + env(safe-area-inset-top)) 20px 16px",
    background: `linear-gradient(180deg, ${blackAlpha(0.72)} 0%, transparent 100%)`,
  },
  remixBar: {
    position: "absolute", top: 108, left: 0, right: 0, zIndex: 20,
    textAlign: "center", background: `${redAlpha(0.2)}`,
    borderBottom: `1px solid ${redAlpha(0.3)}`,
    padding: "8px 16px", color: "#F87171", fontSize: 13, fontWeight: 800,
  },
  videoPicker: {
    flex: 1, position: "relative",
    display: "flex", alignItems: "center", justifyContent: "center",
    minHeight: "calc(100dvh - 88px)", cursor: "pointer",
  },
  videoFull: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", objectFit: "cover" },
  videoEmptyState: { display: "flex", flexDirection: "column", alignItems: "center", gap: SP[4], padding: SP[8] * 1.5, zIndex: 1 },
  videoEmptyIconWrap: {
    width: 108, height: 108, borderRadius: "50%",
    background: `${goldAlpha(0.08)}`,
    border: `2px solid ${goldAlpha(0.2)}`,
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: `0 0 40px ${goldAlpha(0.1)}`,
  },
  videoEmptyKicker: { margin: 0, fontSize: 9, fontWeight: 900, letterSpacing: "3.5px", textTransform: "uppercase", color: GOLD, textAlign: "center" },
  videoEmptyLabel: { margin: 0, color: "#fff", fontSize: 22, fontWeight: 900, textAlign: "center", letterSpacing: "-0.02em", lineHeight: 1.1 },
  videoEmptySub: { margin: 0, color: whiteAlpha(0.35), fontSize: 13, textAlign: "center", lineHeight: 1.5 },
  videoBottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "20px 24px 44px",
    background: `linear-gradient(0deg, ${blackAlpha(0.85)} 0%, transparent 100%)`,
  },
  galleryBtn: {
    padding: "11px 22px", borderRadius: RADIUS.full,
    border: `1px solid ${whiteAlpha(0.2)}`, background: blackAlpha(0.4),
    color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer",
  },
  nextBtn: {
    padding: "13px 30px", borderRadius: RADIUS.full, border: "none",
    background: `linear-gradient(135deg, ${RED}, ${RED_DARK})`,
    color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer",
    boxShadow: `0 6px 24px ${redAlpha(0.45)}`,
  },

  // ── Setup step
  setupPage: { minHeight: "100dvh", background: pageBg(0.1), display: "flex", flexDirection: "column" },
  setupHeader: {
    position: "sticky", top: 0, zIndex: 20,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "calc(14px + env(safe-area-inset-top)) 16px 14px",
    background: blackAlpha(0.96), backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderBottom: `1px solid ${BORDER}`,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: RADIUS.full,
    border: `1px solid ${BORDER_2}`, background: whiteAlpha(0.05),
    color: "#fff", fontSize: 18, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    transition: `opacity ${MOTION.fast}`,
  },
  headerTitle: { flex: 1, color: "#fff", fontSize: 16, fontWeight: 900, textAlign: "center", letterSpacing: "-0.01em" },
  postBtn: {
    padding: "10px 22px", borderRadius: RADIUS.full, border: "none",
    background: `linear-gradient(145deg, ${RED}, ${RED_DARK})`,
    color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer",
    boxShadow: `0 4px 16px ${redAlpha(0.35)}, inset 0 1px 0 ${whiteAlpha(0.1)}`,
  },
  setupScroll: {
    flex: 1, overflowY: "auto",
    padding: `${SP[4]}px ${SP[4]}px ${SP[12]}px`,
    display: "flex", flexDirection: "column", gap: SP[4],
    maxWidth: 600, width: "100%", margin: "0 auto", boxSizing: "border-box",
  },

  // ── Section header (eyebrow + title)
  sectionBlock: { display: "flex", flexDirection: "column", gap: 3, paddingTop: SP[2] },
  sectionKicker: {
    margin: 0, fontSize: 9, fontWeight: 900, letterSpacing: "3.5px",
    textTransform: "uppercase", color: RED,
  },
  sectionTitle: {
    margin: "2px 0 0", fontSize: 18, fontWeight: 900, color: "#fff",
    letterSpacing: "-0.02em", lineHeight: 1,
  },

  // Video strip
  videoStrip: {
    display: "flex", gap: SP[3], alignItems: "center",
    padding: `${SP[3]}px ${SP[3]}px`,
    background: SURFACE_1,
    borderRadius: RADIUS.lg, border: `1px solid ${BORDER}`,
  },
  videoThumb: { width: 63, height: 84, borderRadius: RADIUS.sm, objectFit: "cover", background: "#111", flexShrink: 0, display: "block" },
  changeVideoBtn: {
    background: "none", border: `1px solid ${BORDER_2}`,
    borderRadius: RADIUS.full, color: whiteAlpha(0.45),
    fontSize: 12, fontWeight: 700, padding: "5px 12px",
    cursor: "pointer", alignSelf: "flex-start",
  },

  // ── Type tabs (upgraded)
  typeTabs: {
    display: "flex", gap: SP[1],
    padding: SP[1], background: SURFACE_1,
    borderRadius: RADIUS.md, border: `1px solid ${BORDER}`,
  },
  typeTab: {
    flex: 1, padding: "11px 4px", borderRadius: RADIUS.sm,
    border: "1px solid transparent", background: "none",
    color: whiteAlpha(0.38), fontSize: 13, fontWeight: 800,
    cursor: "pointer", whiteSpace: "nowrap",
    transition: `all ${MOTION.fast}`,
    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
  },
  typeTabEmoji: { fontSize: 20, lineHeight: 1 },
  typeTabLabel: { fontSize: 11, fontWeight: 800, letterSpacing: "0.02em" },

  // Fields
  fields: { display: "flex", flexDirection: "column", gap: SP[3] },
  fieldLabel: {
    fontSize: 11, fontWeight: 900, color: whiteAlpha(0.6),
    textTransform: "uppercase", letterSpacing: "0.08em",
  },
  input: {
    background: SURFACE, border: `1px solid ${BORDER_2}`,
    borderRadius: RADIUS.sm, padding: "13px 16px",
    color: "#fff", fontSize: 14, outline: "none",
    width: "100%", boxSizing: "border-box",
    transition: `border-color ${MOTION.fast}`,
  },
  textarea: {
    background: SURFACE, border: `1px solid ${BORDER_2}`,
    borderRadius: RADIUS.sm, padding: "13px 16px",
    color: "#fff", fontSize: 14, minHeight: 82, resize: "none",
    outline: "none", width: "100%", boxSizing: "border-box",
    transition: `border-color ${MOTION.fast}`,
  },
  chipRow: { display: "flex", flexWrap: "wrap", gap: SP[2] },
  chip: {
    padding: "8px 16px", borderRadius: RADIUS.full,
    border: `1px solid ${BORDER_2}`, background: whiteAlpha(0.05),
    color: whiteAlpha(0.45), fontSize: 13, fontWeight: 800, cursor: "pointer",
  },
  chipActive: { background: redAlpha(0.18), border: `1px solid ${redAlpha(0.5)}`, color: "#F87171" },
  chipGreen: { background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.4)", color: "#34D399" },
  chipGold: { background: goldAlpha(0.12), border: `1px solid ${goldAlpha(0.4)}`, color: GOLD },
  chipRed: { background: redAlpha(0.18), border: `1px solid ${redAlpha(0.5)}`, color: "#F87171" },

  // Toggles
  toggleRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: SP[3],
    padding: "14px 16px", borderRadius: RADIUS.md,
    background: SURFACE_1, border: `1px solid ${BORDER}`,
  },
  toggleLabel: { fontSize: 14, fontWeight: 800, color: "#fff" },
  toggleDesc: { fontSize: 12, color: whiteAlpha(0.38), marginTop: 3 },
  toggleBtn: {
    flexShrink: 0, minWidth: 52, padding: "7px 14px",
    borderRadius: RADIUS.full, border: "none", color: "#fff",
    fontSize: 12, fontWeight: 900, cursor: "pointer",
  },

  // Details accordion
  detailsBox: {
    borderRadius: RADIUS.md, border: `1px solid ${BORDER}`,
    overflow: "hidden", background: SURFACE_1,
  },
  detailsToggle: {
    width: "100%", display: "flex", alignItems: "center",
    justifyContent: "space-between", padding: "14px 16px",
    background: "none", border: "none", cursor: "pointer",
  },
  detailsLabel: {
    color: whiteAlpha(0.5), fontSize: 11, fontWeight: 900,
    letterSpacing: "0.08em", textTransform: "uppercase",
  },

  // AI caption box
  aiBox: {
    borderRadius: RADIUS.md,
    background: `linear-gradient(145deg, ${redAlpha(0.06)}, ${SURFACE_1} 50%, ${goldAlpha(0.04)})`,
    border: `1px solid ${BORDER}`,
  },
  aiBoxBtn: {
    width: "100%", display: "flex", alignItems: "center",
    justifyContent: "space-between", padding: "15px 16px",
    background: "none", border: "none", cursor: "pointer",
  },
  aiBoxLabel: { color: GOLD, fontSize: 13, fontWeight: 900, letterSpacing: "0.04em" },
  aiBoxHelp: { margin: 0, color: whiteAlpha(0.45), fontSize: 13, lineHeight: 1.5 },

  // Caption result
  captionResult: {
    display: "flex", flexDirection: "column", gap: SP[2],
    padding: SP[3], borderRadius: RADIUS.md,
    background: whiteAlpha(0.04), border: `1px solid ${goldAlpha(0.14)}`,
  },
  captionSection: {
    display: "grid", gap: SP[1], padding: SP[2],
    borderRadius: RADIUS.sm, background: whiteAlpha(0.04),
  },
  captionLbl: { color: GOLD, fontSize: 10, fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase" },
  captionHook: { color: "#fff", fontSize: 14, fontWeight: 900, lineHeight: 1.45 },
  captionBody: { color: "#fff", fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap" },
  captionActionBtn: {
    padding: "9px 14px", borderRadius: RADIUS.full,
    border: `1px solid ${goldAlpha(0.34)}`, background: goldAlpha(0.1),
    color: GOLD, fontSize: 13, fontWeight: 800, cursor: "pointer",
  },

  primaryBtn: {
    padding: "15px 20px", borderRadius: RADIUS.md, border: "none",
    background: `linear-gradient(145deg, ${RED}, ${RED_DARK})`,
    color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer",
    boxShadow: `0 8px 28px ${redAlpha(0.28)}, inset 0 1px 0 ${whiteAlpha(0.1)}`,
    width: "100%",
  },

  errBox: {
    background: "#3a0a0a", border: `1px solid ${redAlpha(0.5)}`,
    color: "#ff8b8b", padding: "12px 14px",
    borderRadius: RADIUS.sm, fontSize: 13,
  },
  errTxt: { margin: 0, color: "#ff8b8b", fontSize: 13 },
  remixBox: {
    background: redAlpha(0.12), border: `1px solid ${redAlpha(0.35)}`,
    borderRadius: RADIUS.sm, padding: "10px 14px",
    fontSize: 13, color: "#F87171",
  },

  progressWrap: { display: "flex", flexDirection: "column", gap: SP[1] },
  progressTrack: { height: 6, borderRadius: RADIUS.full, background: whiteAlpha(0.08), overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: RADIUS.full, background: `linear-gradient(90deg, ${RED}, ${GOLD})`, transition: "width 200ms ease" },
};

export default S;
