import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata(
  "/train",
  {"mn": "Бэлтгэл", "ko": "트레이닝", "en": "Train"},
  {"mn": "Камераа асаагаад раунд хий — AI цохилт бүрийг тоолж, оноо, засах нэг зүйлийг хэлнэ.", "ko": "카메라를 켜고 라운드 — AI가 펀치를 세고 점수와 고칠 한 가지를 알려줘요.", "en": "Turn on your camera and do a round — AI counts every punch, scores it and tells you the one thing to fix."},
);

export default function TrainLayout({ children }) { return children; }
