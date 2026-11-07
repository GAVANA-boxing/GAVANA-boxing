import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata(
  "/drills",
  {"mn": "AI дасгал үүсгэгч", "ko": "AI 드릴 생성", "en": "AI drill builder"},
  {"mn": "Чиглэлээ сонго — AI танд тохирсон 5 дасгал үүсгэнэ.", "ko": "영역을 고르면 AI가 맞춤 드릴 5개를 만들어요.", "en": "Pick an area — AI makes 5 drills for you."},
);

export default function DrillsLayout({ children }) { return children; }
