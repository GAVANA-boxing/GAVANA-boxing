// ─── GAVANA Design System — single source of truth ───────────────────────────

// Surface hierarchy — Level 0 → 3 (darker base = cinematic depth)
export const BG        = "#090909"; // L0 — true dark page bg
export const SURFACE_1 = "#0d0d0f"; // L1 — section surface
export const SURFACE   = "#111113"; // L2 — interactive card
export const SURFACE_2 = "#161618"; // L3 — focused / active card

// Borders — ultra-subtle, separation via contrast not weight
export const BORDER    = "rgba(255,255,255,0.06)";
export const BORDER_2  = "rgba(255,255,255,0.08)";

// Brand
export const RED      = "#FF3B30";
export const RED_DARK = "#cc2820";
export const PRIMARY  = "#FF3B30";
export const GOLD     = "#F5C451";
export const PURPLE   = "#A78BFA";

// Text
export const TEXT  = "#FFFFFF";
export const MUTED = "#9CA3AF";
export const FAINT = "#4B5563";

// Status
export const SUCCESS = "#22C55E";

// Alpha helpers — pass opacity 0–1
export const redAlpha   = (a) => `rgba(255,59,48,${a})`;
export const goldAlpha  = (a) => `rgba(245,196,81,${a})`;
export const whiteAlpha = (a) => `rgba(255,255,255,${a})`;
export const blackAlpha = (a) => `rgba(0,0,0,${a})`;

// Reusable gradient strings
export const pageBg = (a = 0.08) => `radial-gradient(ellipse at 50% -8%, ${redAlpha(a)} 0%, transparent 50%), ${BG}`;

// ─── Spacing — 8pt grid ───────────────────────────────────────────────────────
export const SP = {
  1:  4,   // 4px
  2:  8,   // 8px
  3:  12,  // 12px
  4:  16,  // 16px
  6:  24,  // 24px
  8:  32,  // 32px
  12: 48,  // 48px
  16: 64,  // 64px
};

// ─── Radius — three levels ────────────────────────────────────────────────────
export const RADIUS = {
  sm:   10,  // chips, small badges, inputs
  md:   14,  // buttons, tabs, small cards
  lg:   18,  // cards, panels
  xl:   24,  // modals, large cards
  full: 999, // pills
};

// ─── Motion physics ───────────────────────────────────────────────────────────
export const MOTION = {
  press:  "90ms ease",
  hover:  "160ms ease",
  fast:   "160ms ease",
  page:   "240ms cubic-bezier(0.16, 1, 0.3, 1)",
  modal:  "280ms cubic-bezier(0.16, 1, 0.3, 1)",
  spring: "320ms cubic-bezier(0.34, 1.56, 0.64, 1)",
};
