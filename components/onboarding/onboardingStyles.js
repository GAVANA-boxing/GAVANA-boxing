import { GOLD, RED, BG, redAlpha, pageBg } from "@/lib/tokens";

const s = {
  page: {
    minHeight: "100dvh",
    background: pageBg(0.15),
    color: "#fff",
    position: "relative",
    overflowX: "hidden",
  },
  loading: {
    minHeight: "100dvh", background: BG,
    display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
  },
  bgGlow: {
    position: "fixed", top: "-20%", left: "50%", transform: "translateX(-50%)",
    width: 640, height: 420,
    background: `radial-gradient(ellipse, ${redAlpha(0.16)} 0%, transparent 65%)`,
    pointerEvents: "none", zIndex: 0,
  },
  progressWrap: {
    position: "sticky", top: 0, zIndex: 10,
    paddingTop: "calc(14px + env(safe-area-inset-top))", paddingBottom: 14,
    background: "rgba(8,8,8,0.88)", backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  progressRow: { display: "flex", gap: 5, justifyContent: "center", padding: "0 20px" },
  progressSeg: {
    height: 4, flex: 1, maxWidth: 70, borderRadius: 999,
    transition: "background 0.35s, box-shadow 0.35s",
  },
  inner: { maxWidth: 440, margin: "0 auto", padding: "0 16px", position: "relative", zIndex: 1 },
  header: { textAlign: "center", padding: "32px 0 22px" },
  kicker: {
    margin: "0 0 8px", fontSize: 10, letterSpacing: 3, color: RED,
    textTransform: "uppercase", fontWeight: 900,
  },
  title: {
    margin: "0 0 8px",
    fontSize: "clamp(28px, 9vw, 36px)",
    fontWeight: 1000,
    lineHeight: 1,
    letterSpacing: "-0.02em",
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
    textTransform: "uppercase",
  },
  subtitle: { margin: 0, fontSize: 14, color: "rgba(255,255,255,0.48)", lineHeight: 1.6 },

  roleCard: {
    display: "flex", alignItems: "center", gap: 14, padding: "18px 16px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
    cursor: "pointer", textAlign: "left", width: "100%",
    transition: "all 0.15s", color: "#fff",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
  },

  archetypeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 },
  archetypeCard: {
    padding: "18px 12px 14px", borderRadius: 18, cursor: "pointer",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
    textAlign: "center", position: "relative", transition: "all 0.18s", minHeight: 120,
    backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
  },
  archetypeEmoji: { fontSize: 32, lineHeight: 1 },
  archetypeName: { fontSize: 12, fontWeight: 900, letterSpacing: 0.2, lineHeight: 1.2 },
  archetypeDesc: { fontSize: 11, color: "rgba(255,255,255,0.42)", lineHeight: 1.35 },
  selectedDot: { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: "50%" },

  weightSection: { marginBottom: 20 },
  fieldLabel: {
    display: "block", fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 900,
    letterSpacing: 2, textTransform: "uppercase", marginBottom: 8,
  },
  select: {
    width: "100%", padding: "12px 14px", borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)",
    color: "#fff", fontSize: 14, outline: "none", colorScheme: "dark", boxSizing: "border-box",
  },

  primaryBtn: {
    width: "100%", padding: 15, borderRadius: 16, border: "none",
    background: `linear-gradient(145deg, ${RED}, #cc2820)`,
    color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer",
    boxShadow: `0 10px 32px ${redAlpha(0.34)}, inset 0 1px 0 rgba(255,255,255,0.12)`,
    letterSpacing: 0.5,
  },
  primaryBtnDisabled: {
    width: "100%", padding: 15, borderRadius: 16, border: "none",
    background: redAlpha(0.16), color: "rgba(255,255,255,0.28)",
    fontSize: 15, fontWeight: 900, cursor: "not-allowed",
  },

  successBanner: {
    background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)",
    borderRadius: 12, padding: "10px 14px", fontSize: 13, fontWeight: 800,
    color: "#34D399", marginBottom: 14,
  },
  gymList: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 },
  gymSkeleton: { height: 64, borderRadius: 16, background: "rgba(255,255,255,0.04)" },
  gymCard: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: 10, padding: "12px 14px", borderRadius: 16,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
  },
  gymCardLeft: { display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 },
  gymLogo: { width: 40, height: 40, borderRadius: 10, objectFit: "cover", flexShrink: 0 },
  gymLogoFallback: {
    width: 40, height: 40, borderRadius: 10, background: redAlpha(0.14),
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
  },
  gymName: { margin: 0, fontSize: 13, fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  gymMeta: { margin: "1px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)" },
  joinBtn: {
    padding: "8px 16px", borderRadius: 999, border: "none",
    background: redAlpha(0.85), color: "#fff", fontSize: 12, fontWeight: 900,
    cursor: "pointer", flexShrink: 0,
  },
  joinBtnDisabled: {
    padding: "8px 16px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.08)",
    background: "transparent", color: "rgba(255,255,255,0.22)", fontSize: 12,
    fontWeight: 900, cursor: "not-allowed", flexShrink: 0,
  },
  joinedBtn: {
    padding: "8px 16px", borderRadius: 999, border: "1px solid rgba(52,211,153,0.28)",
    background: "rgba(52,211,153,0.1)", color: "#34D399", fontSize: 12, fontWeight: 900,
    cursor: "default", flexShrink: 0,
  },
  actionRow: { display: "flex", gap: 10 },
  skipBtn: {
    flex: 1, padding: 14, borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.09)", background: "transparent",
    color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 800, cursor: "pointer",
  },

  welcomeEmoji: { fontSize: 80, lineHeight: 1, marginTop: 44, marginBottom: 18, display: "block" },
  archetypeNameLarge: { margin: "8px 0 0", fontSize: 20, fontWeight: 900 },
  ctaGroup: { display: "flex", flexDirection: "column", gap: 10, marginTop: 32 },
  ghostBtn: {
    width: "100%", padding: 14, borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.1)", background: "transparent",
    color: "rgba(255,255,255,0.55)", fontSize: 14, fontWeight: 800, cursor: "pointer",
  },
};

export default s;
