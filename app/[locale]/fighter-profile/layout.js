import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata(
  "/fighter-profile",
  {"mn": "Fighter DNA", "ko": "Fighter DNA", "en": "Fighter DNA"},
  {"mn": "Таны тулааны хэв маяг, ахиц, техникийн задаргаа.", "ko": "나의 파이팅 스타일, 성장, 기술 분석.", "en": "Your fighting style, progress and technique breakdown."}, { noindex: true },
);

export default function FighterProfileLayout({ children }) { return children; }
