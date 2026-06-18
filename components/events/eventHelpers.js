"use client";

import { RED, GOLD, PURPLE } from "@/lib/tokens";

export const EVENT_TYPES = ["boxing", "mma", "muay_thai", "sparring", "tournament", "seminar"];

export const TYPE_META = {
  boxing:     { mn: "Бокс",     ko: "복싱",    en: "Boxing",      color: RED,       emoji: "🥊" },
  mma:        { mn: "MMA",      ko: "MMA",     en: "MMA",         color: PURPLE,    emoji: "⚔️" },
  muay_thai:  { mn: "Муай Тай", ko: "무에타이", en: "Muay Thai",   color: "#F97316", emoji: "🦵" },
  sparring:   { mn: "Спарринг", ko: "스파링",   en: "Sparring",    color: "#34D399", emoji: "🤜" },
  tournament: { mn: "Тэмцээн",  ko: "토너먼트", en: "Tournament",  color: GOLD,      emoji: "🏆" },
  seminar:    { mn: "Семинар",   ko: "세미나",   en: "Seminar",    color: "#60A5FA", emoji: "📚" },
};

export function getTypeLabel(type, locale) {
  const meta = TYPE_META[type];
  if (!meta) return type;
  return meta[locale] || meta.en;
}

export function formatEventDate(dateStr, locale) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(
    locale === "mn" ? "mn-MN" : locale === "ko" ? "ko-KR" : "en-US",
    { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }
  );
}

export function isUpcoming(event) {
  if (!event.date) return false;
  return new Date(event.date) >= new Date();
}

export function isLive(event) {
  if (!event.date) return false;
  const now = Date.now();
  const start = new Date(event.date).getTime();
  const end = start + (event.durationMinutes || 120) * 60 * 1000;
  return now >= start && now <= end;
}
