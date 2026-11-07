import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata(
  "/history",
  {"mn": "Бэлтгэлийн түүх", "ko": "훈련 기록", "en": "Session history"},
  {"mn": "Бүх бэлтгэл, оноо, цохилтын тоо нэг дор.", "ko": "모든 세션, 점수, 펀치 수를 한곳에서.", "en": "Every round, score and punch count in one place."}, { noindex: true },
);

export default function HistoryLayout({ children }) { return children; }
