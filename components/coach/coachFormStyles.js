import { RED, RED_DARK, redAlpha, GOLD, goldAlpha, RADIUS, whiteAlpha } from "@/lib/tokens";

export const coachFormStyles = {
  fieldLabel: { fontSize: 11, fontWeight: 900, color: GOLD, letterSpacing: 1, textTransform: "uppercase" },
  fieldInput: { width: "100%", minHeight: 42, padding: "0 12px", borderRadius: RADIUS.sm, border: `1px solid ${whiteAlpha(0.1)}`, background: whiteAlpha(0.05), color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" },
  fieldSelect: { width: "100%", minHeight: 42, padding: "0 12px", borderRadius: RADIUS.sm, border: `1px solid ${whiteAlpha(0.1)}`, background: whiteAlpha(0.05), color: "#fff", fontSize: 14, outline: "none", cursor: "pointer", boxSizing: "border-box" },
  fieldTextarea: { width: "100%", padding: "10px 12px", borderRadius: RADIUS.sm, border: `1px solid ${whiteAlpha(0.1)}`, background: whiteAlpha(0.05), color: "#fff", fontSize: 14, outline: "none", resize: "none", lineHeight: 1.5, boxSizing: "border-box" },
  modalActions: { display: "flex", gap: 10, marginTop: 6 },
  cancelBtn: { flex: 1, minHeight: 46, border: `1px solid ${whiteAlpha(0.1)}`, borderRadius: 12, background: whiteAlpha(0.04), color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer" },
  submitBtn: { flex: 2, minHeight: 46, border: "none", borderRadius: 12, background: `linear-gradient(145deg, ${RED}, ${RED_DARK})`, color: "#fff", fontSize: 14, fontWeight: 1000, cursor: "pointer", boxShadow: `0 10px 28px ${redAlpha(0.32)}, inset 0 1px 0 ${whiteAlpha(0.1)}` },
  vibeChip: { flexShrink: 0, padding: "5px 12px", borderRadius: RADIUS.full, border: `1px solid ${redAlpha(0.25)}`, background: redAlpha(0.08), color: "rgba(255,165,130,0.7)", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  vibeChipActive: { flexShrink: 0, padding: "5px 12px", borderRadius: RADIUS.full, border: `1px solid ${redAlpha(0.6)}`, background: redAlpha(0.22), color: "#F87171", fontSize: 12, fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap" },
  featuredSection: { marginBottom: 20, padding: "12px 14px 14px", borderRadius: 16, background: goldAlpha(0.05), border: `1px solid ${goldAlpha(0.12)}`, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" },
  featuredLabel: { margin: "0 0 10px", fontSize: 10, fontWeight: 950, color: GOLD, letterSpacing: 2, textTransform: "uppercase" },
  featuredScroll: { display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" },
  featuredChip: { flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: whiteAlpha(0.04), border: `1px solid ${goldAlpha(0.25)}`, borderRadius: RADIUS.md, padding: "12px 12px 10px", cursor: "pointer", minWidth: 76, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" },
  featuredAvatar: { width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: `2px solid ${goldAlpha(0.5)}` },
  featuredAvatarInitials: { width: 44, height: 44, borderRadius: "50%", background: RED, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 900, color: "#fff", border: `2px solid ${goldAlpha(0.4)}` },
  featuredName: { fontSize: 10, fontWeight: 850, color: whiteAlpha(0.85), maxWidth: 68, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  featuredVerified: { fontSize: 11, color: GOLD, fontWeight: 900, lineHeight: 1 },
};
