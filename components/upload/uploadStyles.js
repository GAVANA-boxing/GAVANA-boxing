import { RED, GOLD, redAlpha, goldAlpha } from "@/lib/tokens";

const S = {
  loading: { minHeight: "100dvh", background: "#0B0B0C", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" },

  // ── Video step
  videoPage: { minHeight: "100dvh", background: "#000", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" },
  videoHeader: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "calc(16px + env(safe-area-inset-top)) 20px 16px",
    background: "linear-gradient(180deg, rgba(0,0,0,0.72) 0%, transparent 100%)",
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
  videoEmptyState: { display: "flex", flexDirection: "column", alignItems: "center", gap: 18, padding: 40, zIndex: 1 },
  videoEmptyIconWrap: { width: 96, height: 96, borderRadius: "50%", background: `${goldAlpha(0.1)}`, border: `1.5px solid ${goldAlpha(0.25)}`, display: "flex", alignItems: "center", justifyContent: "center" },
  videoEmptyLabel: { margin: 0, color: "rgba(255,255,255,0.88)", fontSize: 20, fontWeight: 900, textAlign: "center" },
  videoEmptySub: { margin: 0, color: "rgba(255,255,255,0.35)", fontSize: 13, textAlign: "center" },
  videoBottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "20px 24px 44px",
    background: "linear-gradient(0deg, rgba(0,0,0,0.82) 0%, transparent 100%)",
  },
  galleryBtn: { padding: "10px 20px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.4)", cursor: "pointer" },
  nextBtn: { padding: "12px 28px", borderRadius: 999, border: "none", background: "#FF3B30", color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer", boxShadow: `0 4px 20px ${redAlpha(0.45)}` },

  // ── Setup step
  setupPage: { minHeight: "100dvh", background: "#0B0B0C", display: "flex", flexDirection: "column" },
  setupHeader: {
    position: "sticky", top: 0, zIndex: 20,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "calc(16px + env(safe-area-inset-top)) 20px 14px",
    background: "rgba(11,11,12,0.96)", backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  iconBtn: { width: 40, height: 40, borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  headerTitle: { flex: 1, color: "#fff", fontSize: 16, fontWeight: 900, textAlign: "center" },
  postBtn: { padding: "10px 24px", borderRadius: 999, border: "none", background: "#FF3B30", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer", boxShadow: `0 4px 16px ${redAlpha(0.35)}` },
  setupScroll: { flex: 1, overflowY: "auto", padding: "20px 20px 40px", display: "flex", flexDirection: "column", gap: 20, maxWidth: 600, width: "100%", margin: "0 auto", boxSizing: "border-box" },

  // Video strip
  videoStrip: { display: "flex", gap: 14, alignItems: "center", padding: "12px 14px", background: "rgba(255,255,255,0.04)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)" },
  videoThumb: { width: 63, height: 84, borderRadius: 10, objectFit: "cover", background: "#111", flexShrink: 0, display: "block" },
  changeVideoBtn: { background: "none", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 999, color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 700, padding: "5px 12px", cursor: "pointer", alignSelf: "flex-start" },

  // Type tabs
  typeTabs: { display: "flex", gap: 6, padding: 5, background: "rgba(255,255,255,0.04)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)" },
  typeTab: { flex: 1, padding: "10px 4px", borderRadius: 10, border: "1px solid transparent", background: "none", color: "rgba(255,255,255,0.38)", fontSize: 12, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" },

  // Fields
  fields: { display: "flex", flexDirection: "column", gap: 18 },
  fieldLabel: { fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 1 },
  input: { background: "#111", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, padding: "13px 16px", color: "#fff", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" },
  textarea: { background: "#111", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, padding: "13px 16px", color: "#fff", fontSize: 14, minHeight: 82, resize: "none", outline: "none", width: "100%", boxSizing: "border-box" },
  chipRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: { padding: "8px 16px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 800, cursor: "pointer" },
  chipActive: { background: `${redAlpha(0.18)}`, border: `1px solid ${redAlpha(0.5)}`, color: "#F87171" },
  chipGreen: { background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.4)", color: "#34D399" },
  chipGold: { background: `${goldAlpha(0.12)}`, border: `1px solid ${goldAlpha(0.4)}`, color: GOLD },
  chipRed: { background: `${redAlpha(0.18)}`, border: `1px solid ${redAlpha(0.5)}`, color: "#F87171" },

  // Toggles
  toggleRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" },
  toggleLabel: { fontSize: 14, fontWeight: 800, color: "#fff" },
  toggleDesc: { fontSize: 12, color: "rgba(255,255,255,0.38)", marginTop: 3 },
  toggleBtn: { flexShrink: 0, minWidth: 52, padding: "7px 14px", borderRadius: 999, border: "none", color: "#fff", fontSize: 12, fontWeight: 900 },

  // Details accordion
  detailsBox: { borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden", background: "rgba(255,255,255,0.02)" },
  detailsToggle: { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "none", border: "none", cursor: "pointer" },
  detailsLabel: { color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase" },

  // AI box
  aiBox: { borderRadius: 16, background: `linear-gradient(145deg, ${redAlpha(0.08)}, rgba(11,11,11,0.9) 50%, ${goldAlpha(0.05)})`, border: "1px solid rgba(255,255,255,0.07)" },
  aiBoxBtn: { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 16px", background: "none", border: "none", cursor: "pointer" },
  aiBoxLabel: { color: GOLD, fontSize: 13, fontWeight: 900, letterSpacing: 0.6 },
  aiBoxHelp: { margin: 0, color: "#888", fontSize: 13, lineHeight: 1.5 },

  // Caption result
  captionResult: { display: "flex", flexDirection: "column", gap: 10, padding: 14, borderRadius: 14, background: "rgba(255,255,255,0.05)", border: `1px solid ${goldAlpha(0.14)}` },
  captionSection: { display: "grid", gap: 4, padding: 10, borderRadius: 10, background: "rgba(255,255,255,0.04)" },
  captionLbl: { color: GOLD, fontSize: 10, fontWeight: 900, letterSpacing: 1.2, textTransform: "uppercase" },
  captionHook: { color: "#fff", fontSize: 14, fontWeight: 900, lineHeight: 1.45 },
  captionBody: { color: "#fff", fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap" },
  captionActionBtn: { padding: "9px 14px", borderRadius: 999, border: `1px solid ${goldAlpha(0.34)}`, background: `${goldAlpha(0.1)}`, color: GOLD, fontSize: 13, fontWeight: 800, cursor: "pointer" },

  primaryBtn: { padding: "14px 20px", borderRadius: 14, border: "none", background: "#FF3B30", color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer", boxShadow: `0 8px 24px ${redAlpha(0.28)}` },

  errBox: { background: "#3a0a0a", border: `1px solid ${redAlpha(0.5)}`, color: "#ff8b8b", padding: "12px 14px", borderRadius: 10, fontSize: 13 },
  errTxt: { margin: 0, color: "#ff8b8b", fontSize: 13 },
  remixBox: { background: `${redAlpha(0.12)}`, border: `1px solid ${redAlpha(0.35)}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#F87171" },

  progressWrap: { display: "flex", flexDirection: "column", gap: 6 },
  progressTrack: { height: 6, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999, background: "#FF3B30", transition: "width 180ms ease" },
};

export default S;
