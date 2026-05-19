import { useState, useEffect } from "react";
import { GOLD, PURPLE } from "@/lib/tokens";

export function useWeeklyCountdown() {
  const [ms, setMs] = useState(null);
  useEffect(() => {
    const getMs = () => {
      const now = new Date();
      const daysUntilMonday = (8 - now.getUTCDay()) % 7 || 7;
      const nextMonday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilMonday));
      return Math.max(0, nextMonday - now);
    };
    setMs(getMs());
    const id = setInterval(() => setMs(getMs()), 1000);
    return () => clearInterval(id);
  }, []);
  return ms;
}

export function formatCountdown(ms, locale) {
  if (ms === null) return "";
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (locale === "mn") return d > 0 ? `${d}өд ${h}ц ${m}м` : `${h}ц ${m}м ${s}с`;
  if (locale === "ko") return d > 0 ? `${d}일 ${h}시 ${m}분` : `${h}시간 ${m}분 ${s}초`;
  return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`;
}

export function getRankMedal(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

export function getEntryBadges({ entry, rank, weeklyEntries, streakEntries, improvementEntries }) {
  const badges = [];
  if (weeklyEntries[0]?.userId === entry.userId)
    badges.push({ icon: "👑", label: "Weekly Champ", color: GOLD });
  if (rank <= 3)
    badges.push({ icon: "🏆", label: "Top 3", color: GOLD });
  else if (rank <= 10)
    badges.push({ icon: "🏅", label: "Top 10", color: "#60A5FA" });
  if (streakEntries[0]?.userId === entry.userId && streakEntries[0]?.bestScore >= 7)
    badges.push({ icon: "🔥", label: "Streak King", color: "#FB923C" });
  const impIdx = improvementEntries.findIndex((e) => e.userId === entry.userId);
  if (impIdx >= 0 && impIdx < 3)
    badges.push({ icon: "⚡", label: "Rising", color: "#34D399" });
  return badges.slice(0, 2);
}

export function getScoreColor(score) {
  if (score >= 9) return GOLD;
  if (score >= 7) return "#60A5FA";
  if (score >= 5) return PURPLE;
  return "#FB923C";
}

export function getAvatarUrl(profile) {
  return (
    profile?.photoURL ||
    profile?.profileImageUrl ||
    profile?.profileImage ||
    profile?.avatarUrl ||
    ""
  );
}

export function dedupeWeeklyByUser(results, seasonId) {
  const byUser = {};
  for (const r of results) {
    if (r.seasonId !== seasonId) continue;
    const uid = r.userId;
    const score = Number(r.score);
    if (Number.isNaN(score)) continue;
    if (!byUser[uid] || score > byUser[uid].bestScore) {
      byUser[uid] = { userId: uid, bestScore: score };
    }
  }
  return Object.values(byUser)
    .sort((a, b) => b.bestScore - a.bestScore)
    .slice(0, 50);
}
