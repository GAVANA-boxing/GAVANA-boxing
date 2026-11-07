// GAVANA brand primitives as inline-style objects — the same look as the landing
// page (components/landing/landing.module.css): one red primary action, quiet
// secondary actions, soft cards, a pill kicker, display-font titles.

export const BRAND = {
  red: "#FF3B30",
  gold: "#F5C451",
  green: "#34D399",
  text: "#FFFFFF",
  muted: "rgba(255,255,255,0.62)",
  faint: "rgba(255,255,255,0.5)", // 5.3:1 on the page background (0.38 was 3.5:1, under WCAG AA for small text)
  line: "rgba(255,255,255,0.08)",
  card: "rgba(255,255,255,0.03)",
};

export const btnPrimary = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  width: "100%",
  minHeight: 52,
  padding: "0 22px",
  border: "none",
  borderRadius: 14,
  background: "linear-gradient(135deg, #ff4d42 0%, #ff3b30 45%, #d92a20 100%)",
  color: "#fff",
  fontSize: 16,
  fontWeight: 700,
  letterSpacing: 0,
  textTransform: "none",
  cursor: "pointer",
  boxShadow: "0 10px 30px rgba(255,59,48,0.30), inset 0 1px 0 rgba(255,255,255,0.2)",
};

export const btnSecondary = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  width: "100%",
  minHeight: 48,
  padding: "0 18px",
  borderRadius: 14,
  border: `1px solid ${BRAND.line}`,
  background: "rgba(255,255,255,0.05)",
  color: BRAND.text,
  fontSize: 15,
  fontWeight: 600,
  letterSpacing: 0,
  textTransform: "none",
  cursor: "pointer",
};

export const card = {
  borderRadius: 20,
  background: BRAND.card,
  border: `1px solid ${BRAND.line}`,
};

export const kickerPill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  margin: 0,
  padding: "5px 11px",
  borderRadius: 999,
  border: "1px solid rgba(255,59,48,0.35)",
  background: "rgba(255,59,48,0.08)",
  color: "#ff7a72",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

export const kickerDot = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: BRAND.red,
  boxShadow: `0 0 10px ${BRAND.red}`,
};

export const sectionLabel = {
  margin: 0,
  color: BRAND.gold,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

export const displayTitle = {
  margin: 0,
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  textTransform: "uppercase",
  lineHeight: 1,
  letterSpacing: "0.01em",
  color: BRAND.text,
};

// Frosted glass — for buttons, pills and cards that sit on a glow or photo.
export const glass = {
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.12)",
  backdropFilter: "blur(18px) saturate(1.4)",
  WebkitBackdropFilter: "blur(18px) saturate(1.4)",
};

export const glassCard = {
  ...glass,
  background: "rgba(255,255,255,0.045)",
  borderRadius: 24,
  color: BRAND.text,
};

// The page background every app page shares: near-black with a red glow on top.
export const pageBackground = "radial-gradient(ellipse 80% 40% at 50% -10%, rgba(255,59,48,0.16) 0%, transparent 60%), #08080a";
