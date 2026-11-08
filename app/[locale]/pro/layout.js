import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata(
  "/pro",
  { mn: "GAVANA Pro", ko: "GAVANA Pro", en: "GAVANA Pro" },
  {
    mn: "AI коуч хязгааргүй, дараалал хамгаалах, Fighter DNA тайлан. Сард 9,900₮. Раунд, оноо, AI дүгнэлт үргэлж үнэгүй.",
    ko: "무제한 AI 코치, 연속 기록 보호, Fighter DNA 리포트. 월 9,900₮. 라운드·점수·AI 디브리프는 언제나 무료.",
    en: "Unlimited AI coach, streak saves, Fighter DNA report. 9,900₮ a month. Rounds, scores and the AI debrief stay free.",
  },
);

export default function ProLayout({ children }) { return children; }
