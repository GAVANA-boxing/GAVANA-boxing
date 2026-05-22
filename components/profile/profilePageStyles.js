import {
  RED, RED_DARK, GOLD, PURPLE, BG, SURFACE_1, SURFACE_2,
  BORDER, BORDER_2, RADIUS, SP, MOTION,
  redAlpha, goldAlpha, whiteAlpha, blackAlpha,
} from "@/lib/tokens";

const styles = {
  // ── Page header ────────────────────────────────────────────────────────────
  backHeader: {
    position: "sticky", top: 0, zIndex: 10,
    display: "flex", alignItems: "center",
    paddingTop: "calc(12px + env(safe-area-inset-top))",
    paddingBottom: 12, paddingLeft: 16, paddingRight: 16,
    background: blackAlpha(0.92),
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
  },
  backBtnProfile: {
    width: 40, height: 40, border: `1px solid ${BORDER_2}`,
    background: whiteAlpha(0.05), color: "#fff", borderRadius: RADIUS.sm,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", padding: 0,
    transition: `opacity ${MOTION.fast}`,
  },

  // ── Fighter card shell ─────────────────────────────────────────────────────
  fighterCard: {
    width: "100%",
    paddingBottom: SP[6],
    background: `radial-gradient(ellipse at 50% 0%, ${redAlpha(0.24)} 0%, ${redAlpha(0.04)} 40%, transparent 65%), linear-gradient(180deg, #141416 0%, #0B0B0C 100%)`,
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
  },

  // ── Cover photo ────────────────────────────────────────────────────────────
  coverPhotoSection: {
    position: "relative",
    height: 260,
    overflow: "hidden",
    background: `linear-gradient(135deg, ${redAlpha(0.6)} 0%, #1a0404 40%, #0d0d0d 100%)`,
  },
  coverPhotoImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  coverPhotoFallback: {
    width: "100%", height: "100%",
    background: `radial-gradient(ellipse at 30% 40%, ${redAlpha(0.65)} 0%, ${redAlpha(0.2)} 50%, transparent 100%)`,
  },
  coverPhotoGradient: {
    position: "absolute", inset: 0,
    background: `linear-gradient(to bottom, ${blackAlpha(0.05)} 0%, ${blackAlpha(0.22)} 50%, ${blackAlpha(0.95)} 100%)`,
    pointerEvents: "none",
  },
  coverPhotoEditBtn: {
    position: "absolute", bottom: 72, right: 14,
    background: blackAlpha(0.55), backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
    border: `1px solid ${whiteAlpha(0.22)}`, borderRadius: RADIUS.sm,
    color: "#fff", width: 34, height: 34, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: `opacity ${MOTION.fast}`,
  },

  // ── Avatar anchored bottom-left of cover ──────────────────────────────────
  avatarAnchor: {
    position: "absolute",
    bottom: -40,
    left: 16,
  },
  avatarFrame: {
    width: 96, height: 96,
    borderRadius: "50%",
    background: RED,
    border: `3px solid ${redAlpha(0.9)}`,
    boxShadow: `0 0 0 2px ${goldAlpha(0.45)}, 0 0 0 4px ${redAlpha(0.12)}, 0 16px 56px ${blackAlpha(0.7)}, 0 0 36px ${redAlpha(0.28)}`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 38, fontWeight: 1000,
    color: "#FFFFFF", overflow: "hidden", position: "relative",
  },
  avatarImage: { width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", display: "block" },

  // ── Identity row (name + primary action) ──────────────────────────────────
  identityRow: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    padding: "52px 16px 0",
    gap: SP[3],
  },
  identityLeft: {
    display: "flex", flexDirection: "column", gap: 3, minWidth: 0, flex: 1,
  },
  fighterName: {
    margin: 0,
    color: "#FFFFFF",
    fontSize: "clamp(28px, 9vw, 44px)",
    lineHeight: 0.95,
    fontWeight: 1000,
    letterSpacing: -0.5,
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  fighterUsername: {
    marginTop: 4, color: whiteAlpha(0.5), fontSize: 13, fontWeight: 700,
  },
  identityActionBtn: {
    flexShrink: 0,
    padding: "10px 18px",
    borderRadius: RADIUS.sm,
    border: `1px solid ${whiteAlpha(0.14)}`,
    background: whiteAlpha(0.06),
    color: "#fff",
    fontSize: 13, fontWeight: 800,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: `all ${MOTION.fast}`,
  },

  // ── Bio ───────────────────────────────────────────────────────────────────
  bio: {
    maxWidth: 480, margin: `${SP[3]}px 16px 0`,
    color: whiteAlpha(0.55), fontSize: 12, lineHeight: 1.65,
    fontWeight: 400, fontStyle: "italic", letterSpacing: 0.2,
  },

  // ── Digital License Card ──────────────────────────────────────────────────
  licenseCard: {
    margin: `${SP[4]}px 16px 0`,
    borderRadius: RADIUS.lg,
    background: `linear-gradient(145deg, ${whiteAlpha(0.04)}, ${SURFACE_1})`,
    border: `1px solid ${BORDER_2}`,
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    boxShadow: `0 4px 24px ${blackAlpha(0.3)}, inset 0 1px 0 ${whiteAlpha(0.05)}`,
    display: "flex",
    alignItems: "flex-start",
    gap: 0,
    overflow: "hidden",
    padding: "16px 14px",
    minHeight: 80,
  },
  licenseRankBlock: {
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: SP[2], flexShrink: 0, width: 72,
    border: "none", background: "transparent", cursor: "pointer",
    padding: 0,
  },
  licenseDivider: {
    width: 1, alignSelf: "stretch",
    background: BORDER,
    margin: "0 14px",
    flexShrink: 0,
  },
  licenseTagsGrid: {
    flex: 1, display: "flex", flexWrap: "wrap", gap: 6, alignContent: "flex-start",
  },
  licenseTag: {
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "4px 10px", borderRadius: RADIUS.full,
    border: "1px solid",
    fontSize: 11, fontWeight: 800, letterSpacing: 0.2, lineHeight: 1.4,
    whiteSpace: "nowrap",
  },

  // ── Achievements shelf ────────────────────────────────────────────────────
  achievementsShelf: {
    display: "flex", gap: 7, overflowX: "auto", scrollbarWidth: "none",
    WebkitOverflowScrolling: "touch",
    padding: "14px 16px 0",
  },
  achievementCard: {
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "9px 10px", borderRadius: RADIUS.sm,
    background: whiteAlpha(0.04), border: "1px solid",
    minWidth: 68, gap: 4, flexShrink: 0,
    boxShadow: `0 2px 12px ${blackAlpha(0.25)}`,
  },

  // ── Stats row ─────────────────────────────────────────────────────────────
  statsRow: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
    gap: 1, margin: `${SP[4]}px 16px 0`,
    borderTop: `1px solid ${BORDER}`,
    borderBottom: `1px solid ${BORDER}`,
    background: whiteAlpha(0.01),
    borderRadius: RADIUS.md, overflow: "hidden",
  },
  statButton: {
    minHeight: 68, border: "none",
    borderRight: `1px solid ${BORDER}`,
    background: "transparent", color: "#FFFFFF",
    display: "grid", alignContent: "center", justifyItems: "center",
    gap: 6, cursor: "pointer", WebkitTapHighlightColor: "transparent",
    transition: `background ${MOTION.fast}`,
  },
  statNumber: {
    color: "#FFFFFF", fontSize: 23, lineHeight: 1,
    fontWeight: 1000, fontFamily: "var(--font-display, 'Anton', sans-serif)",
  },
  statLabel: {
    color: whiteAlpha(0.5), fontSize: 9, fontWeight: 850,
    letterSpacing: 1.2, textTransform: "uppercase",
  },

  // ── Stat section eyebrow ──────────────────────────────────────────────────
  statsSectionKicker: {
    margin: `${SP[4]}px 16px 0`,
    fontSize: 9, fontWeight: 900, letterSpacing: "3.5px",
    textTransform: "uppercase", color: RED,
  },

  // ── Action buttons ────────────────────────────────────────────────────────
  actionRow: {
    display: "flex", justifyContent: "center", flexWrap: "wrap",
    gap: 10, padding: `14px 16px 0`,
  },
  ghostAction: {
    padding: "10px 16px", border: `1px solid ${BORDER_2}`,
    borderRadius: RADIUS.sm, background: whiteAlpha(0.05),
    color: "#FFFFFF", fontSize: 13, fontWeight: 800, cursor: "pointer",
    minHeight: 38, display: "flex", alignItems: "center", justifyContent: "center",
    transition: `all ${MOTION.fast}`,
  },
  followAction: {
    padding: "12px 34px", border: "none", borderRadius: RADIUS.sm,
    color: "#FFFFFF", fontSize: 14, fontWeight: 900,
  },

  // ── Tabs ──────────────────────────────────────────────────────────────────
  profileTabs: {
    display: "flex", width: "100%",
    borderBottom: `1px solid ${BORDER}`,
    background: blackAlpha(0.92),
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    position: "sticky", top: 0, zIndex: 8,
  },
  profileTab: {
    flex: 1, minHeight: 50, border: "none", background: "transparent",
    color: whiteAlpha(0.45), fontSize: 11, fontWeight: 900,
    letterSpacing: 1.2, textTransform: "uppercase", cursor: "pointer",
    transition: `all ${MOTION.fast}`,
  },
  profileTabActive: {
    color: "#FFFFFF", boxShadow: `inset 0 -2px 0 ${RED}`,
  },

  // ── Reel grid tiles ───────────────────────────────────────────────────────
  reelPreviewMedia: {
    width: "100%", height: "100%", objectFit: "cover", display: "block",
    background: `linear-gradient(145deg, ${BG}, #141416)`,
  },
  deleteReelButton: {
    position: "absolute", top: 8, right: 8, zIndex: 3,
    width: 30, height: 30, borderRadius: RADIUS.full,
    border: `1px solid ${whiteAlpha(0.16)}`,
    background: blackAlpha(0.72), color: "#fff",
    fontSize: 20, fontWeight: 800, lineHeight: "26px",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: `0 10px 24px ${blackAlpha(0.36)}`,
    backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
  },
  reelGridEmpty: {
    gridColumn: "1 / -1", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "72px 24px 80px", gap: 12, background: BG,
  },
  reelGridEmptyIcon: {
    fontSize: 52, lineHeight: 1, marginBottom: 4,
    filter: `drop-shadow(0 4px 16px ${redAlpha(0.4)})`,
  },
  reelGridEmptyTitle: {
    margin: 0, color: "#fff", fontWeight: 950, fontSize: 20, textAlign: "center",
  },
  reelGridEmptyText: {
    margin: 0, fontSize: 14, color: whiteAlpha(0.55),
    textAlign: "center", maxWidth: 280, lineHeight: 1.5,
  },
  reelGridEmptyCta: {
    marginTop: 8, padding: "12px 26px", borderRadius: RADIUS.full,
    border: "none", background: `linear-gradient(145deg, ${RED}, ${RED_DARK})`, color: "#fff",
    fontSize: 14, fontWeight: 900, cursor: "pointer", letterSpacing: 0.2,
    boxShadow: `0 6px 20px ${redAlpha(0.28)}, inset 0 1px 0 ${whiteAlpha(0.1)}`,
  },
  reelTileTypeBadge: {
    position: "absolute", top: 6, right: 6, fontSize: 14, lineHeight: 1,
    pointerEvents: "none", zIndex: 4,
    filter: `drop-shadow(0 2px 6px ${blackAlpha(0.95)})`,
  },
  reelTileOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: "20px 6px 6px",
    background: `linear-gradient(to top, ${blackAlpha(0.85)}, transparent)`,
    pointerEvents: "none", zIndex: 3,
  },
  reelTileLikes: {
    color: whiteAlpha(0.9), fontSize: 11, fontWeight: 800,
    letterSpacing: 0.2, textShadow: `0 1px 6px ${blackAlpha(0.9)}`, marginBottom: 2,
  },
  reelTileCaption: {
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
    color: whiteAlpha(0.65), fontSize: 10, fontWeight: 600,
    textShadow: `0 1px 4px ${blackAlpha(0.9)}`,
  },

  // ── XP section ────────────────────────────────────────────────────────────
  rankRow: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 10, marginTop: 10, marginBottom: 2,
    background: "transparent", border: "none", cursor: "pointer",
    padding: "6px 14px", borderRadius: RADIUS.md, WebkitTapHighlightColor: "transparent",
  },
  rankLabel: { fontSize: 14, fontWeight: 900, letterSpacing: 0.8, textTransform: "uppercase" },
  xpWrap: { maxWidth: 430, margin: "12px auto 0", padding: "0 4px" },
  xpTopRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  xpAmount: { fontSize: 13, fontWeight: 900, letterSpacing: 0.3 },
  xpNextLabel: { fontSize: 11, color: whiteAlpha(0.45), textAlign: "right" },
  xpTrack: { width: "100%", height: 8, borderRadius: RADIUS.full, background: whiteAlpha(0.07), overflow: "visible", position: "relative" },
  xpFill: {
    height: "100%", borderRadius: RADIUS.full,
    transition: "width 600ms cubic-bezier(0.34, 1.56, 0.64, 1)",
    background: `linear-gradient(90deg, ${RED}, ${GOLD})`,
    boxShadow: `0 0 12px 2px ${redAlpha(0.5)}`, position: "relative",
  },

  // ── Fighter tags (legacy) ─────────────────────────────────────────────────
  fighterTagsRow: {
    display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center",
    margin: "14px auto 4px", maxWidth: 430,
  },
  fighterTag: {
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "4px 10px", borderRadius: RADIUS.full, border: "1px solid",
    fontSize: 11, fontWeight: 850, letterSpacing: 0.3, lineHeight: 1.4,
  },
};

export default styles;
