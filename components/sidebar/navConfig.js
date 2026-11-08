"use client";

import {
  IcoDash,
  IcoHome,
  IcoPlay,
  IcoBrain,
  IcoTarget,
  IcoFighter,
  IcoSwords,
  IcoBars,
  IcoFlash,
  IcoUsers,
  IcoBuilding,
  IcoMessage,
} from "./icons";

// Same structure as the mobile tab bar (Home · Progress · Train · Coach · Me),
// then the social groups (hidden in core mode).
export const NAV = [
  {
    group: "GAVANA", groupLabel: { en: "GAVANA", mn: "GAVANA", ko: "GAVANA" },
    items: [
      { Icon: IcoHome,   label: { en: "Home", mn: "Нүүр", ko: "홈" },        path: "home" },
      { Icon: IcoDash,   label: { en: "Progress", mn: "Дэвшил", ko: "성장" },    path: "progress" },
      { Icon: IcoBrain,  label: { en: "Train", mn: "Бэлтгэл", ko: "훈련" },       path: "train" },
      { Icon: IcoFlash,  label: { en: "Ghost Round", mn: "Сүүдэр раунд", ko: "고스트 라운드" }, path: "ghost" },
      { Icon: IcoTarget, label: { en: "Coach", mn: "Коуч", ko: "코치" },       path: "coach" },
    ],
  },
  {
    group: "YOU", groupLabel: { en: "YOU", mn: "БИ", ko: "나" },
    items: [
      { Icon: IcoFighter, label: { en: "Fighter DNA", mn: "Тулаанчийн ДНХ", ko: "파이터 DNA" },   path: "fighter-profile" },
      { Icon: IcoBars,    label: { en: "History", mn: "Түүх", ko: "기록" },       path: "history" },
    ],
  },
  {
    group: "DISCOVER", groupLabel: { en: "DISCOVER", mn: "НЭЭХ", ko: "탐색" },
    items: [
      { Icon: IcoHome,   label: { en: "Discover", mn: "Нээх", ko: "탐색" },   path: "discover" },
      { Icon: IcoPlay,   label: { en: "Reels", mn: "Бичлэг", ko: "릴스" },      path: "reels" },
    ],
  },
  {
    group: "COMPETE", groupLabel: { en: "COMPETE", mn: "ӨРСӨЛДӨХ", ko: "경쟁" },
    items: [
      { Icon: IcoSwords,   label: { en: "Sparring", mn: "Спарринг", ko: "스파링" },    path: "sparring" },
      { Icon: IcoBars,     label: { en: "Leaderboard", mn: "Тэргүүлэгчид", ko: "리더보드" }, path: "leaderboard" },
      { Icon: IcoFlash,    label: { en: "Challenges", mn: "Сорилт", ko: "챌린지" },  path: "challenges" },
    ],
  },
  {
    group: "EXPLORE", groupLabel: { en: "EXPLORE", mn: "СУДЛАХ", ko: "둘러보기" },
    items: [
      { Icon: IcoUsers,    label: { en: "Fighters", mn: "Тулаанчид", ko: "파이터" },    path: "fighters" },
      { Icon: IcoBuilding, label: { en: "Gyms", mn: "Заал", ko: "체육관" },        path: "gyms" },
    ],
  },
  {
    group: "SOCIAL", groupLabel: { en: "SOCIAL", mn: "ХАРИЛЦАА", ko: "소셜" },
    items: [
      { Icon: IcoMessage, label: { en: "Inbox", mn: "Мессеж", ko: "메시지" },        path: "inbox" },
    ],
  },
];
