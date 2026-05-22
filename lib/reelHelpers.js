import { translate } from "@/lib/i18n";

export function getSafeLikeCount(reel) {
  let count = reel?.likes;
  if (typeof count !== "number" || isNaN(count)) count = reel?.likesCount;
  if (typeof count !== "number" || isNaN(count)) count = 0;
  return Math.max(0, count);
}

export function getSafeViewCount(reel) {
  let count = reel?.views;
  if (typeof count !== "number" || isNaN(count)) count = 0;
  return Math.max(0, count);
}

export function getSafeCommentsCount(reel) {
  let count = reel?.commentsCount;
  if (typeof count !== "number" || isNaN(count)) count = 0;
  return Math.max(0, count);
}

export function getEngagementScore(reel) {
  return getSafeLikeCount(reel) + getSafeViewCount(reel);
}

export function getCreatedAtMs(reel) {
  if (!reel?.createdAt) return 0;
  const date = reel.createdAt.toDate ? reel.createdAt.toDate() : new Date(reel.createdAt);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function formatCompactCount(count) {
  const safeCount = Math.max(0, Number(count) || 0);
  if (safeCount >= 1000000) return `${(safeCount / 1000000).toFixed(safeCount >= 10000000 ? 0 : 1).replace(/\.0$/, "")}M`;
  if (safeCount >= 1000) return `${(safeCount / 1000).toFixed(safeCount >= 10000 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(safeCount);
}

export function formatViews(count) {
  return `${formatCompactCount(count)} views`;
}

export function sortReelsByEngagement(reels) {
  return [...reels].sort((a, b) => {
    const scoreDelta = getEngagementScore(b) - getEngagementScore(a);
    if (scoreDelta !== 0) return scoreDelta;
    return getCreatedAtMs(b) - getCreatedAtMs(a);
  });
}

export function getCreatorName(reel, creatorProfile) {
  return creatorProfile?.displayName || creatorProfile?.username || reel?.username || "user";
}

export function getCreatorPhoto(creatorProfile) {
  return creatorProfile?.photoURL || creatorProfile?.profileImageUrl || creatorProfile?.profileImage || "";
}

export function getCaptionToggleLabel(locale, expanded) {
  const labels = {
    mn: { more: "дэлгэрэнгүй", less: "хураах" },
    ko: { more: "더보기", less: "접기" },
  };
  const l = labels[locale];
  if (l) return expanded ? l.less : l.more;
  return expanded ? translate(locale, "less") : translate(locale, "more");
}

export function cleanCaption(text) {
  return String(text || "")
    .replace(/\*\*[^*]+\*\*\s*:\s*/g, "")
    .replace(/\*\*/g, "")
    .replace(/^[ \t]*(Hook|Caption|Hashtags?)\s*:\s*/gim, "")
    .replace(/^\s*[-•]\s*/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function extractFeedbackScore(feedbackText) {
  const cleanedText = String(feedbackText || "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/`/g, "");
  const labelMatch = cleanedText.match(/(?:score|РѕРЅРѕРѕ|м ђм€)\s*[:пјљ-]?\s*(\d+(?:[.,]\d+)?)\s*\/\s*10/i);
  const fallbackMatch = cleanedText.match(/(\d+(?:[.,]\d+)?)\s*\/\s*10/i);
  const match = labelMatch || fallbackMatch;
  if (!match) return undefined;
  const score = Number(String(match[1]).replace(",", "."));
  if (!Number.isFinite(score)) return undefined;
  return Math.max(0, Math.min(10, score));
}

export function getFirstValue(...values) {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== "") return value;
  }
  return null;
}

export function formatSpeedMetric(reel) {
  const speed = getFirstValue(
    reel?.speed, reel?.speedScore, reel?.aiSpeed,
    reel?.metrics?.speed, reel?.analysis?.speed
  );
  if (speed === null) return "Medium";
  if (typeof speed === "number" && Number.isFinite(speed)) return speed > 10 ? `${Math.round(speed)}` : `${speed.toFixed(1)}`;
  return String(speed);
}

export function formatComboCountMetric(reel) {
  const comboCount = getFirstValue(
    reel?.comboCount, reel?.combo_count, reel?.combos,
    reel?.metrics?.comboCount, reel?.analysis?.comboCount
  );
  if (Array.isArray(comboCount)) return comboCount.length.toString();
  if (typeof comboCount === "number" && Number.isFinite(comboCount)) return Math.max(0, Math.round(comboCount)).toString();
  if (typeof comboCount === "string" && comboCount.trim()) return comboCount;
  const caption = String(reel?.description || reel?.caption || "").toLowerCase();
  const punchMatches = caption.match(/\b(jab|cross|hook|uppercut|body|slip|roll)\b/g);
  return Math.max(1, Math.min(6, punchMatches?.length || 1)).toString();
}
