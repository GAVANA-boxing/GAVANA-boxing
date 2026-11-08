import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata(
  "/train",
  {"mn": "Бэлтгэл", "ko": "트레이닝", "en": "Train"},
  {"mn": "Камераа асаагаад раунд хий — цохилт, хамгаалалтыг чинь ажиглаж, оноо болон засах нэг зүйлийг хэлнэ.", "ko": "카메라를 켜고 라운드 — 펀치와 가드를 살펴 점수와 고칠 한 가지를 알려줘요.", "en": "Turn on your camera and do a round — it watches your punches and guard, scores the round and gives you one thing to fix."},
);

export default function TrainLayout({ children }) { return children; }
