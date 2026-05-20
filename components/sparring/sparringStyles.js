import { redAlpha, RED } from "@/lib/tokens";

const s = {
  page: { minHeight: "100dvh", background: `radial-gradient(ellipse at 50% 0%, ${redAlpha(0.12)} 0%, transparent 40%), #070707`, color: "#fff", display: "flex", flexDirection: "column" },
  loadWrap: { minHeight: "100dvh", background: "#070707", display: "flex", alignItems: "center", justifyContent: "center" },
  spinner: { width: 26, height: 26, border: "2px solid #C1121F", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  header: {
    position: "sticky", top: 0, zIndex: 20,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "calc(14px + env(safe-area-inset-top)) 16px 12px",
    background: "rgba(7,7,7,0.96)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  backBtn: {
    width: 40, height: 40, borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.7)", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  headerCenter: { textAlign: "center" },
  headerKicker: { fontSize: 9, fontWeight: 900, color: `${redAlpha(0.7)}`, letterSpacing: 3, textTransform: "uppercase" },
  headerTitle: { fontSize: 15, fontWeight: 900, color: "#fff" },
  tabBar: {
    display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(7,7,7,0.96)", position: "sticky", top: "calc(52px + env(safe-area-inset-top))", zIndex: 19,
  },
  tabBtn: {
    flex: 1, padding: "12px 4px", border: "none", background: "transparent",
    color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 800,
    cursor: "pointer", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
    borderBottom: "2px solid transparent", transition: "all 200ms ease",
  },
  tabBtnActive: { color: "#fff", borderBottom: "2px solid #C1121F" },
  tabBadge: {
    minWidth: 16, height: 16, borderRadius: 999,
    background: RED, color: "#fff",
    fontSize: 9, fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center",
    padding: "0 4px",
  },
  toggleBanner: {
    borderRadius: 14, border: "1px solid",
    padding: "12px 14px",
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
    transition: "all 300ms ease",
  },
  toggleLeft: { display: "flex", alignItems: "flex-start", gap: 10, flex: 1, minWidth: 0 },
  toggleDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0, marginTop: 4, transition: "all 300ms ease" },
  toggleTitle: { fontSize: 13, fontWeight: 800, marginBottom: 2, transition: "color 300ms ease" },
  toggleSub: { fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.45 },
  toggleBtn: {
    flexShrink: 0, padding: "8px 14px", borderRadius: 999,
    fontSize: 12, fontWeight: 900, cursor: "pointer",
    whiteSpace: "nowrap", transition: "all 200ms ease",
  },
  filterSection: { padding: "10px 16px 0", display: "flex", flexDirection: "column", gap: 8 },
  filterRow: { display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" },
  filterChip: {
    flexShrink: 0, padding: "6px 12px", borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.03)",
    color: "rgba(255,255,255,0.38)", fontSize: 12, fontWeight: 700,
    cursor: "pointer", whiteSpace: "nowrap",
  },
  weightSelect: {
    width: "100%", padding: "9px 12px", borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.55)", fontSize: 12, outline: "none", appearance: "none",
  },
  countBar: { padding: "10px 16px 4px" },
  countTxt: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.28)", letterSpacing: 0.4 },
  list: { flex: 1, display: "flex", flexDirection: "column", padding: "4px 0 0" },
  sectionLabel: { padding: "12px 16px 4px", fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.28)", letterSpacing: 2, textTransform: "uppercase" },
  empty: {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    padding: "48px 32px", gap: 10,
  },
  emptyTitle: { margin: 0, fontSize: 16, fontWeight: 900, color: "#fff", textAlign: "center" },
  emptySub: { margin: 0, fontSize: 13, color: "rgba(255,255,255,0.35)", textAlign: "center", lineHeight: 1.55, maxWidth: 280 },
};

const c = {
  card: {
    background: "rgba(255,255,255,0.025)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "3px 14px 14px 3px",
    boxShadow: "0 0 0 0.5px rgba(0,0,0,0.5) inset, 0 12px 40px rgba(0,0,0,0.2)",
    padding: "13px 13px 10px",
    display: "flex", flexDirection: "column", gap: 10,
  },
  cardTop: { display: "flex", gap: 12, alignItems: "flex-start" },
  avatarWrap: { position: "relative", flexShrink: 0 },
  avatar: { width: 48, height: 48, borderRadius: "50%", objectFit: "cover", display: "block" },
  avatarFallback: {
    width: 48, height: 48, borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 18, fontWeight: 900, color: "#fff",
  },
  infoBlock: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontWeight: 900, color: "#fff", marginBottom: 5, lineHeight: 1 },
  chips: { display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 4 },
  chip: {
    fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.45)",
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 999, padding: "2px 8px",
  },
  location: { fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 3 },
  bio: { fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.45 },
  msgBtn: {
    width: "100%", padding: "10px", borderRadius: 10, border: "none",
    color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
    boxShadow: `0 4px 16px ${redAlpha(0.25)}`,
  },
  myLabel: { textAlign: "center", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.28)", padding: "2px 0" },
};

export { c };
export default s;
