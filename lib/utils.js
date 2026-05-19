export function getTimestampMs(ts) {
  if (!ts) return 0;
  if (ts.toMillis) return ts.toMillis();
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getPreviousLocalDateKey(date = new Date()) {
  const previous = new Date(date);
  previous.setDate(previous.getDate() - 1);
  return getLocalDateKey(previous);
}

export function formatCompact(n) {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return String(num);
}

export function formatScore(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return "0";
  return n.toFixed(1).replace(/\.0$/, "");
}

export function getActiveChallengeStreak(profile) {
  const lastDate = String(profile?.lastChallengeDate || "");
  if (lastDate !== getLocalDateKey() && lastDate !== getPreviousLocalDateKey()) return 0;
  return Number(profile?.challengeStreak) || 0;
}

export function formatAgo(ts, locale) {
  const ms = getTimestampMs(ts);
  if (!ms) return "";
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (locale === "mn") {
    if (mins < 1) return "Дөнгөж сая";
    if (mins < 60) return `${mins}м өмнө`;
    if (hrs < 24) return `${hrs}ц өмнө`;
    return `${days}өдр өмнө`;
  }
  if (locale === "ko") {
    if (mins < 1) return "방금";
    if (mins < 60) return `${mins}분 전`;
    if (hrs < 24) return `${hrs}시간 전`;
    return `${days}일 전`;
  }
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

export function getChallengeRank(score) {
  const n = Number(score);
  if (n >= 9) return "S";
  if (n >= 8) return "A";
  if (n >= 7) return "B";
  if (n >= 6) return "C";
  return "D";
}
