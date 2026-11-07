import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata(
  "/ghost",
  {"mn": "Ghost Round", "ko": "고스트 라운드", "en": "Ghost Round"},
  {"mn": "Дасгалжуулагчийн бодит хөдөлгөөнийг дагаж jab–cross хий.", "ko": "코치의 실제 움직임을 따라 잽–크로스.", "en": "Copy a real coach's jab–cross, move for move."},
);

export default function GhostLayout({ children }) { return children; }
