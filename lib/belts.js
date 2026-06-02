// Belt progression system — visual layer over XP
// Users see belts + %, not raw XP numbers

export const BELTS = [
  {
    key: "whiteBelt",
    minXP: 0,
    color: "#D1D5DB",
    gradient: "linear-gradient(135deg,#9CA3AF,#E5E7EB)",
    glow: null,
  },
  {
    key: "blueBelt",
    minXP: 500,
    color: "#3B82F6",
    gradient: "linear-gradient(135deg,#1D4ED8,#60A5FA)",
    glow: "rgba(59,130,246,0.45)",
  },
  {
    key: "purpleBelt",
    minXP: 2000,
    color: "#8B5CF6",
    gradient: "linear-gradient(135deg,#5B21B6,#A78BFA)",
    glow: "rgba(139,92,246,0.5)",
  },
  {
    key: "brownBelt",
    minXP: 5000,
    color: "#D97706",
    gradient: "linear-gradient(135deg,#78350F,#D97706)",
    glow: "rgba(217,119,6,0.5)",
  },
  {
    key: "blackBelt",
    minXP: 10000,
    color: "#F9FAFB",
    gradient: "linear-gradient(135deg,#1F2937,#6B7280)",
    glow: "rgba(249,250,251,0.35)",
    isMax: true,
  },
];

export function getBelt(xp) {
  const n = Number(xp) || 0;
  for (let i = BELTS.length - 1; i >= 0; i--) {
    if (n >= BELTS[i].minXP) return BELTS[i];
  }
  return BELTS[0];
}

export function getNextBelt(xp) {
  const n = Number(xp) || 0;
  for (const b of BELTS) {
    if (b.minXP > n) return b;
  }
  return null;
}

export function getBeltProgress(xp) {
  const n = Number(xp) || 0;
  const current = getBelt(n);
  const next = getNextBelt(n);
  if (!next) return 100;
  const range = next.minXP - current.minXP;
  const pos = n - current.minXP;
  return Math.min(100, Math.round((pos / range) * 100));
}
