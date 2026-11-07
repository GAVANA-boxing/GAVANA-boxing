/**
 * Push notification copy, written in the RECIPIENT's language (users/{uid}.locale, saved when they allow
 * notifications). The sender only says what happened (kind) and who did it; the server picks the words and the link.
 */
export const PUSH_LOCALES = ["mn", "ko", "en"];

const pick = (name, fallback) => (name && String(name).trim().slice(0, 60)) || fallback;

export const PUSH_KINDS = {
  follow: {
    path: (actorId) => `/profile/${actorId}`,
    mn: (a) => ({ title: "👤 Шинэ дагагч", body: `${pick(a, "Нэг хэрэглэгч")} таныг дагаж эхэллээ` }),
    ko: (a) => ({ title: "👤 새 팔로워", body: `${pick(a, "누군가")}님이 회원님을 팔로우하기 시작했습니다` }),
    en: (a) => ({ title: "👤 New follower", body: `${pick(a, "Someone")} started following you` }),
  },
  challenge: {
    path: () => "/train",
    mn: (a) => ({ title: "⚔️ Шинэ сорилт!", body: `${pick(a, "Тулаанч")} танд PvP сорилт илгээлээ` }),
    ko: (a) => ({ title: "⚔️ 새 챌린지!", body: `${pick(a, "파이터")}님이 PvP를 신청했습니다` }),
    en: (a) => ({ title: "⚔️ New challenge!", body: `${pick(a, "A fighter")} challenged you on GAVANA` }),
  },
  sparringRequest: {
    path: () => "/sparring",
    mn: (a) => ({ title: "🥊 Sparring хүсэлт", body: `${pick(a, "Тулаанч")} тантай sparring хийх хүсэлт илгээлээ` }),
    ko: (a) => ({ title: "🥊 스파링 요청", body: `${pick(a, "파이터")}님이 스파링을 요청했습니다` }),
    en: (a) => ({ title: "🥊 Sparring request", body: `${pick(a, "A fighter")} wants to spar with you` }),
  },
  sparringAccepted: {
    path: () => "/sparring",
    mn: (a) => ({ title: "✅ Sparring зөвшөөрөгдлөө!", body: `${pick(a, "Тулаанч")} таны sparring хүсэлтийг зөвшөөрлөө` }),
    ko: (a) => ({ title: "✅ 스파링 수락됨!", body: `${pick(a, "파이터")}님이 스파링 요청을 수락했습니다` }),
    en: (a) => ({ title: "✅ Sparring accepted!", body: `${pick(a, "A fighter")} accepted your sparring request` }),
  },
};

/** Title, body and link for one push in the recipient's language (unknown language → Mongolian, like the scheduled pushes). */
export function pushCopy(kind, { locale, actorName, actorId }) {
  const k = PUSH_KINDS[kind];
  if (!k) return null;
  const lang = PUSH_LOCALES.includes(locale) ? locale : "mn";
  return { ...k[lang](actorName), url: `/${lang}${k.path(actorId)}` };
}
