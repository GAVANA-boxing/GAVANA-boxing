/**
 * Brand design tokens — single source of truth for GAVANA colors.
 *
 * Usage:
 *   import { RED, GOLD } from "@/lib/tokens";
 *   style={{ color: GOLD, background: RED }}
 */

export const RED  = "#C1121F";
export const GOLD = "#D4AF37";
export const PURPLE = "#A78BFA";

/** rgba helpers — pass opacity 0–1 */
export const redAlpha  = (a) => `rgba(193,18,31,${a})`;
export const goldAlpha = (a) => `rgba(212,175,55,${a})`;
