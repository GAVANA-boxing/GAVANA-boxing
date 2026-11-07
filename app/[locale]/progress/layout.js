import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata(
  "/progress",
  {"mn": "Дэвшил", "ko": "성장", "en": "Progress"},
  {"mn": "Цол, оноо, цохилтын харьцаа — таны ахиц нэг дор.", "ko": "등급, 점수, 펀치 비율 — 성장을 한눈에.", "en": "Rank, scores and punch mix — your progress in one place."}, { noindex: true },
);

export default function ProgressLayout({ children }) { return children; }
