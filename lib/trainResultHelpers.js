import { useEffect, useState } from "react";
import { getSessionIdentity } from "@/lib/combatMemory";

export function useCountUp(target, duration = 1000) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (target == null) return;
    setDisplay(0);
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      setDisplay((1 - Math.pow(1 - p, 3)) * target);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);
  return display;
}

export const IDENTITY_SUBS = {
  "PRESSURE INITIATOR": { en: "Forward-dominant pressure style",      mn: "Урагшлах даралтын хэв маяг",       ko: "앞으로 밀어붙이는 압박 스타일" },
  "MOBILE OUTBOXER":    { en: "Strong lateral movement control",      mn: "Хажуугийн хөдөлгөөний хяналт",      ko: "강한 측면 이동 제어" },
  "REACTIVE COUNTER":   { en: "Movement-reactive defensive reads",    mn: "Хөдөлгөөнд суурилсан хамгаалалт",   ko: "움직임 기반 방어 판단" },
  "GUARD INSTABILITY":  { en: "Guard line needs consolidation",       mn: "Хамгаалалтын шугамаа бэхжүүл",      ko: "가드 라인 강화 필요" },
  "BALANCE BREAKER":    { en: "Dynamic weight transfer detected",     mn: "Динамик жингийн шилжилт илэрсэн",   ko: "동적 체중 이동 감지" },
  "NARROW BASE":        { en: "Stance too narrow — widen your base",  mn: "Зогсоол хэт нарийн — өргөл",        ko: "스탠스 너무 좁음 — 넓혀라" },
  "FORWARD HUNTER":     { en: "Aggressive entry pattern detected",    mn: "Довтолгооны хэв маяг илэрсэн",      ko: "공격적인 진입 패턴 감지" },
  "SHARP EXECUTION":    { en: "High-efficiency movement session",     mn: "Өндөр үр ашигтай хөдөлгөөн",        ko: "고효율 움직임 세션" },
  "SOLID FOUNDATION":   { en: "Consistent movement quality",         mn: "Тогтвортой хөдөлгөөний чанар",      ko: "일관된 움직임 품질" },
  "DEVELOPING STYLE":   { en: "Pattern emerging — keep building",    mn: "Хэв маяг бүрдэж байна — үргэлжлүүл", ko: "패턴 형성 중 — 계속 쌓아라" },
  "RAW ENERGY":         { en: "Pure intensity — structure coming",   mn: "Цэвэр эрч хүч — бүтэц бүрдэж байна", ko: "순수한 강도 — 구조 형성 중" },
};

// The round's one-line title in the fighter's language (getSessionIdentity returns the key).
export const IDENTITY_TITLES = {
  "PRESSURE INITIATOR": { mn: "ДАРАМТ ЭХЛҮҮЛЭГЧ", ko: "압박 주도형" },
  "MOBILE OUTBOXER":    { mn: "ХӨДӨЛГӨӨНТ БОКСЧИН", ko: "기동형 아웃복서" },
  "REACTIVE COUNTER":   { mn: "ХАРИУ ЦОХИГЧ", ko: "반응형 카운터" },
  "GUARD INSTABILITY":  { mn: "ХАМГААЛАЛТ САЛАНГИД", ko: "가드 불안정" },
  "BALANCE BREAKER":    { mn: "ТЭНЦВЭР АЛДАГЧ", ko: "균형 흔들림" },
  "NARROW BASE":        { mn: "НАРИЙН ЗОГСООЛ", ko: "좁은 스탠스" },
  "FORWARD HUNTER":     { mn: "УРАГШ ДАЙРАГЧ", ko: "전진 사냥꾼" },
  "SHARP EXECUTION":    { mn: "ХУРЦ ГҮЙЦЭТГЭЛ", ko: "날카로운 실행" },
  "SOLID FOUNDATION":   { mn: "ТОГТВОРТОЙ СУУРЬ", ko: "탄탄한 기본기" },
  "DEVELOPING STYLE":   { mn: "ХЭВ МАЯГ БҮРДЭЖ БАЙНА", ko: "스타일 형성 중" },
  "RAW ENERGY":         { mn: "ЦЭВЭР ЭРЧ ХҮЧ", ko: "순수한 에너지" },
};

export function getIdentityWithSub(score, movementEvents, poseMetrics, locale = "en") {
  const key = getSessionIdentity(score, movementEvents, poseMetrics);
  const title = (locale !== "en" && IDENTITY_TITLES[key]?.[locale]) || key;
  const subs = IDENTITY_SUBS[key];
  const sub = subs ? (subs[locale] || subs.en) : "";
  return { title, sub, key };
}

export function computeComparison(curr, prev) {
  if (!curr || !prev || (curr.frameCount ?? 0) < 5) return [];
  const rows = [];

  const cExt = curr.punchExtension?.angleDeg;
  const pExt = prev.punchExtension?.angleDeg;
  if (cExt != null && pExt != null) {
    const d = Math.round(cExt - pExt);
    if (Math.abs(d) >= 3) rows.push({ label: "Extension", value: `${d > 0 ? "+" : ""}${d}°`, improved: d > 0 });
  }

  const gScore = (s) => s === "good" ? 1 : 0;
  const cG = curr.guardHeight?.status;
  const pG = prev.guardHeight?.status;
  if (cG && pG && cG !== pG) {
    const imp = gScore(cG) > gScore(pG);
    rows.push({ label: "Guard", value: imp ? "Better" : "Dropped more", improved: imp });
  }

  const cSnap = curr.velocityStats?.avgSnapVelocity;
  const pSnap = prev.velocityStats?.avgSnapVelocity;
  if (cSnap != null && pSnap != null && pSnap > 0) {
    const pct = Math.round(((cSnap - pSnap) / pSnap) * 100);
    if (Math.abs(pct) >= 8) rows.push({ label: "Hand speed", value: `${pct > 0 ? "+" : ""}${pct}%`, improved: pct > 0 });
  }

  const cCnt = curr.punchCount;
  const pCnt = prev.punchCount;
  if (cCnt != null && pCnt != null) {
    const d = cCnt - pCnt;
    if (Math.abs(d) >= 3) rows.push({ label: "Punches", value: `${d > 0 ? "+" : ""}${d}`, improved: d > 0 });
  }

  const cMs = curr.velocityStats?.avgRecoilMs;
  const pMs = prev.velocityStats?.avgRecoilMs;
  if (cMs != null && pMs != null) {
    const d = Math.round(pMs - cMs);
    if (Math.abs(d) >= 40) rows.push({ label: "Recovery", value: `${d > 0 ? "-" : "+"}${Math.abs(d)}ms`, improved: d > 0 });
  }

  return rows;
}

export function getBestPunchType(poseMetrics) {
  const pb = poseMetrics?.punchBreakdown;
  if (!pb) return null;
  const types = [
    { key: "jab",   label: "Jab",   count: pb.jab?.count   || 0 },
    { key: "cross", label: "Cross", count: pb.cross?.count || 0 },
    { key: "hook",  label: "Hook",  count: pb.hook?.count  || 0 },
  ];
  const best = types.reduce((a, b) => b.count > a.count ? b : a, types[0]);
  return best.count > 0 ? best.label : null;
}


export function getMovementSummary(movementEvents = []) {
  const seen = {};
  for (const ev of movementEvents) {
    if (!seen[ev.type]) seen[ev.type] = { label: ev.label, count: 0 };
    seen[ev.type].count++;
  }
  return Object.values(seen).sort((a, b) => b.count - a.count);
}

export function fmtTime(ms) {
  const s = Math.floor(Math.max(0, ms) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
