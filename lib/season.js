/**
 * Weekly season helpers.
 * seasonId format: "YYYY-WW" (ISO week, Monday-based).
 */

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7; // Mon=1 ... Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - day); // nearest Thursday
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

export function getCurrentSeasonId(date = new Date()) {
  const { year, week } = getISOWeek(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function getSeasonLabel(seasonId) {
  if (!seasonId) return "";
  const [year, wPart] = seasonId.split("-W");
  if (!wPart) return seasonId;
  // First day of ISO week
  const jan4 = new Date(Date.UTC(Number(year), 0, 4)); // Jan 4 is always in W1
  const jan4Day = jan4.getUTCDay() || 7;
  const weekStart = new Date(jan4);
  weekStart.setUTCDate(jan4.getUTCDate() - (jan4Day - 1) + (Number(wPart) - 1) * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  const fmt = (d) => d.toLocaleDateString("en", { month: "short", day: "numeric" });
  return `${fmt(weekStart)} – ${fmt(weekEnd)}`;
}
