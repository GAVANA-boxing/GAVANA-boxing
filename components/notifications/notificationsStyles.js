import { BRAND, glass, pageBackground } from "@/components/ui/brand";
import { BG, BORDER, GOLD, RADIUS, RED, SURFACE_1, TEXT, blackAlpha, goldAlpha, pageBg, redAlpha, whiteAlpha } from "@/lib/tokens";

const styles = {
  page: {
    minHeight: "100dvh",
    background: pageBackground,
    color: TEXT,
    paddingBottom: "calc(88px + env(safe-area-inset-bottom))",
  },
  centered: {
    minHeight: "100dvh", background: BG, color: TEXT,
    display: "flex", alignItems: "center", justifyContent: "center",
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
    ...glass,
    flexShrink: 0, padding: "8px 14px", borderRadius: RADIUS.full,
    color: BRAND.muted, fontFamily: "inherit", fontSize: 13, fontWeight: 600,
    cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s ease",
  },
  filterChipActive: {
    background: "#fff", border: "1px solid #fff",
    color: "#0b0b0d", fontWeight: 600,
  },
  clearBtn: {
    flexShrink: 0, padding: "6px 12px", borderRadius: RADIUS.full,
    border: "1px solid rgba(248,113,113,0.22)",
    background: "rgba(248,113,113,0.06)",
    color: "#F87171", fontSize: 11, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap",
  },
  markReadBtn: {
    flexShrink: 0, padding: "6px 12px", borderRadius: RADIUS.full,
    border: `1px solid ${goldAlpha(0.28)}`, background: goldAlpha(0.07),
    color: GOLD, fontSize: 11, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap",
  },

  list: { maxWidth: 540, margin: "0 auto", padding: "10px 16px" },
  group: { display: "grid", gap: 5, marginBottom: 28 },
  groupTitle: {
    color: RED, fontSize: 12, fontWeight: 900,
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
  emptyTitle: { margin: 0, color: TEXT, fontSize: 17, fontWeight: 800 },
  emptyText: { margin: "8px 0 0", maxWidth: 260, lineHeight: 1.55, fontSize: 13, color: whiteAlpha(0.35) },

  notification: {
    width: "100%", display: "flex", alignItems: "center", gap: 13,
    padding: "13px 14px",
    border: `1px solid ${BORDER}`,
    borderRadius: RADIUS.lg, color: TEXT, textAlign: "left", cursor: "pointer",
    position: "relative", overflow: "hidden",
    transition: "background 200ms ease",
    backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
    boxShadow: `0 2px 12px ${blackAlpha(0.2)}`,
  },
  unreadBar: {
    position: "absolute", top: 0, left: 0, width: 3, bottom: 0,
    background: RED, borderRadius: "3px 0 0 3px",
    boxShadow: `0 0 8px ${redAlpha(0.7)}`,
  },
  avatarWrap: { position: "relative", flexShrink: 0 },
  avatar: {
    width: 46, height: 46, borderRadius: "50%",
    background: whiteAlpha(0.07),
    color: TEXT, display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 800, fontSize: 17, overflow: "hidden", flexShrink: 0,
    border: `1.5px solid ${whiteAlpha(0.1)}`,
  },
  avatarImage: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  typeBadge: {
    position: "absolute", bottom: -2, right: -4,
    width: 20, height: 20, borderRadius: "50%",
    background: SURFACE_1, border: `1.5px solid ${whiteAlpha(0.1)}`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 12, lineHeight: 1,
  },

  notificationBody: { minWidth: 0, flex: 1 },
  notificationTopLine: {
    display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3,
  },
  username: {
    fontSize: 13, fontWeight: 800, color: TEXT,
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "65%",
  },
  date: { color: whiteAlpha(0.28), fontSize: 12, whiteSpace: "nowrap", flexShrink: 0 },
  notificationText: { fontSize: 13, color: whiteAlpha(0.52), lineHeight: 1.4 },
  commentPreview: {
    marginTop: 5, color: whiteAlpha(0.28), fontSize: 12, lineHeight: 1.4,
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontStyle: "italic",
  },
  pvpScoreRow: { marginTop: 4, fontSize: 12, fontWeight: 700, color: whiteAlpha(0.45) },

  dismissBtn: {
    flexShrink: 0, width: 26, height: 26, border: "none",
    background: "transparent", color: whiteAlpha(0.2),
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
    color: "#F87171", padding: "10px 20px", borderRadius: RADIUS.md,
    fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
    boxShadow: `0 8px 32px ${blackAlpha(0.5)}`,
    pointerEvents: "none",
  },
};

export default styles;
