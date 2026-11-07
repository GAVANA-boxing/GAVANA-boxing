import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata(
  "/home",
  {"mn": "Нүүр", "ko": "홈", "en": "Home"},
  {"mn": "Өнөөдрийн бэлтгэл, ахиц, Fighter DNA.", "ko": "오늘의 훈련, 성장, Fighter DNA.", "en": "Today's training, your progress and Fighter DNA."}, { noindex: true },
);

export default function HomeLayout({ children }) { return children; }
