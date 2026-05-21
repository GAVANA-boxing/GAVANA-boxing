import { RED, BG, redAlpha, GOLD, goldAlpha } from "@/lib/tokens";

const styles = {
  page: {
    minHeight: "100dvh",
    background: `radial-gradient(ellipse at 50% -8%, ${redAlpha(0.13)} 0%, transparent 50%), ${BG}`,
    color: "#fff",
    paddingBottom: "calc(88px + env(safe-area-inset-bottom))",
  },
  centered: {
    minHeight: "100dvh", background: BG, color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  header: {
    position: "sticky", top: 0, zIndex: 10,
    display: "grid", gridTemplateColumns: "56px 1fr 44px", alignItems: "center", gap: 12,
    padding: "calc(env(safe-area-inset-top) + 14px) 16px 14px",
    background: "rgba(11,11,12,0.9)",
    backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  backButton: {
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    borderRadius: 12, width: 40, height: 40,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", flexShrink: 0,
    backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
  },
  eyebrow: {
    margin: 0, color: RED, fontSize: 9, fontWeight: 900,
    letterSpacing: 3, textAlign: "center", textTransform: "uppercase",
  },
  title: {
    margin: "3px 0 0", textAlign: "center",
    fontSize: 22, fontWeight: 1000, letterSpacing: "-0.02em",
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
    textTransform: "uppercase",
  },
  unreadPill: {
    justifySelf: "end", minWidth: 26, height: 26, borderRadius: 13,
    background: RED, boxShadow: `0 0 14px ${redAlpha(0.6)}`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, fontWeight: 900,
  },
  unreadPillMuted: {
    justifySelf: "end", minWidth: 26, height: 26, borderRadius: 13,
    background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, fontWeight: 800,
  },

  filterBar: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "10px 16px 6px", maxWidth: 540, margin: "0 auto",
  },
  filterChips: {
    display: "flex", gap: 6, flex: 1,
    overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch",
  },
  filterChip: {
    flexShrink: 0, padding: "6px 13px", borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.09)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700,
    cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s ease",
  },
  filterChipActive: {
    background: redAlpha(0.16), border: `1px solid ${redAlpha(0.52)}`,
    color: "#fff", fontWeight: 900, boxShadow: `0 0 14px ${redAlpha(0.15)}`,
  },
  clearBtn: {
    flexShrink: 0, padding: "6px 12px", borderRadius: 999,
    border: "1px solid rgba(248,113,113,0.22)",
    background: "rgba(248,113,113,0.06)",
    color: "#F87171", fontSize: 11, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap",
  },
  markReadBtn: {
    flexShrink: 0, padding: "6px 12px", borderRadius: 999,
    border: `1px solid ${goldAlpha(0.28)}`, background: goldAlpha(0.07),
    color: GOLD, fontSize: 11, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap",
  },

  list: { maxWidth: 540, margin: "0 auto", padding: "10px 16px" },
  group: { display: "grid", gap: 5, marginBottom: 28 },
  groupTitle: {
    color: RED, fontSize: 10, fontWeight: 900,
    letterSpacing: 3, textTransform: "uppercase",
    padding: "6px 2px 8px",
  },

  empty: {
    minHeight: "60vh", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", textAlign: "center",
  },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    background: redAlpha(0.1), color: goldAlpha(0.85),
    border: `1px solid ${goldAlpha(0.18)}`,
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: 16, boxShadow: `0 0 40px ${redAlpha(0.14)}`,
  },
  emptyTitle: { margin: 0, color: "#fff", fontSize: 17, fontWeight: 800 },
  emptyText: { margin: "8px 0 0", maxWidth: 260, lineHeight: 1.55, fontSize: 13, color: "rgba(255,255,255,0.35)" },

  notification: {
    width: "100%", display: "flex", alignItems: "center", gap: 13,
    padding: "13px 14px",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16, color: "#fff", textAlign: "left", cursor: "pointer",
    position: "relative", overflow: "hidden",
    transition: "background 200ms ease",
    backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
    boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
  },
  unreadBar: {
    position: "absolute", top: 0, left: 0, width: 3, bottom: 0,
    background: RED, borderRadius: "3px 0 0 3px",
    boxShadow: `0 0 8px ${redAlpha(0.7)}`,
  },
  avatarWrap: { position: "relative", flexShrink: 0 },
  avatar: {
    width: 46, height: 46, borderRadius: "50%",
    background: "rgba(255,255,255,0.07)",
    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 800, fontSize: 17, overflow: "hidden", flexShrink: 0,
    border: "1.5px solid rgba(255,255,255,0.1)",
  },
  avatarImage: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  typeBadge: {
    position: "absolute", bottom: -2, right: -4,
    width: 20, height: 20, borderRadius: "50%",
    background: "#111", border: "1.5px solid rgba(255,255,255,0.1)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 10, lineHeight: 1,
  },

  notificationBody: { minWidth: 0, flex: 1 },
  notificationTopLine: {
    display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3,
  },
  username: {
    fontSize: 13, fontWeight: 800, color: "#fff",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "65%",
  },
  date: { color: "rgba(255,255,255,0.28)", fontSize: 10, whiteSpace: "nowrap", flexShrink: 0 },
  notificationText: { fontSize: 13, color: "rgba(255,255,255,0.52)", lineHeight: 1.4 },
  commentPreview: {
    marginTop: 5, color: "rgba(255,255,255,0.28)", fontSize: 12, lineHeight: 1.4,
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontStyle: "italic",
  },
  pvpScoreRow: { marginTop: 4, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.45)" },

  dismissBtn: {
    flexShrink: 0, width: 26, height: 26, border: "none",
    background: "transparent", color: "rgba(255,255,255,0.2)",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    borderRadius: 8, padding: 0, marginLeft: 4,
    transition: "color 0.15s, background 0.15s",
  },
  toast: {
    position: "fixed",
    bottom: "calc(72px + env(safe-area-inset-bottom))",
    left: "50%", transform: "translateX(-50%)",
    zIndex: 9999,
    background: "rgba(20,8,8,0.97)",
    border: "1px solid rgba(248,113,113,0.32)",
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    color: "#F87171", padding: "10px 20px", borderRadius: 14,
    fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    pointerEvents: "none",
  },
};

export default styles;
