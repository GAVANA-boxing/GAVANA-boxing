"use client";

import { loc } from "@/lib/loc";

export function getTs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  return Number(ts) || 0;
}

export function formatMsgTime(ts) {
  const ms = getTs(ts);
  if (!ms) return "";
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function shouldShowDate(prev, curr) {
  if (!prev) return true;
  const p = new Date(getTs(prev.createdAt));
  const c = new Date(getTs(curr.createdAt));
  return p.toDateString() !== c.toDateString();
}

export function formatDateLabel(ts, locale) {
  const d = new Date(getTs(ts));
  const today = new Date();
  if (d.toDateString() === today.toDateString())
    return loc(locale, "Өнөөдөр", "오늘", "Today");
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString())
    return loc(locale, "Өчигдөр", "어제", "Yesterday");
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

export function formatTime(ts, locale) {
  const ms = getTs(ts);
  if (!ms) return "";
  const diff = Date.now() - ms;
  if (diff < 60000) return loc(locale, "Одоо", "방금", "Now");
  if (diff < 3600000) {
    const m = Math.floor(diff / 60000);
    return loc(locale, `${m}м`, `${m}분`, `${m}m`);
  }
  if (diff < 86400000) {
    const h = Math.floor(diff / 3600000);
    return loc(locale, `${h}ц`, `${h}시간`, `${h}h`);
  }
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function getQuickReplies(isUserCoach, recipientIsCoach, locale) {
  if (isUserCoach) {
    return loc(locale,
      ["Маш сайн ажилласан! 🥊", "Дараагийн дасгал хэзээ вэ?", "Гарын байдлаа анхаараарай", "Хурдаа нэмэгдүүл", "Footwork-оо сайжруулья"],
      ["잘 했어요! 🥊", "다음 훈련은 언제인가요?", "가드를 신경 쓰세요", "속도를 높여봐요", "풋워크를 개선해봐요"],
      ["Great work! 🥊", "When's your next session?", "Watch your guard", "Pick up the speed", "Let's work on footwork"]
    );
  }
  if (recipientIsCoach) {
    return loc(locale,
      ["Хуваарь авах боломжтой юу?", "Хичээлийн үнэ хэд вэ?", "Анхан шатнаас эхлэх боломжтой юу?", "Онлайнаар зааж чадах уу?", "Спарринг бэлтгэлд туслаарай"],
      ["레슨 예약 가능한가요?", "수업료는 얼마인가요?", "초보도 가능한가요?", "온라인 수업 가능한가요?", "스파링 준비 도움을 주세요"],
      ["Are you available for lessons?", "What are your rates?", "Can you train beginners?", "Do you coach online?", "Help me prep for sparring"]
    );
  }
  return loc(locale,
    ["👋 Сайн уу!", "Спарринг хийх үү?", "Challenge-д оролцох уу?", "Хэр байна?"],
    ["👋 안녕하세요!", "스파링 할래요?", "챌린지 같이 해요?", "어떻게 지내세요?"],
    ["👋 Hey!", "Want to spar?", "Join me for a challenge?", "How's training?"]
  );
}
