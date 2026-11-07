import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata(
  "/mitts",
  { mn: "Mitt дасгал", ko: "미트 드릴", en: "Mitt drill" },
  { mn: "Дасгалжуулагч шиг дуудлагад зөв гараар, хурдан хариул — 30 секундийн хариу үйлдлийн раунд.", ko: "코치의 콜에 맞는 손으로 빠르게 — 30초 반응 라운드.", en: "Answer a coach's calls with the right hand, fast — a 30-second reaction round." },
);

export default function MittsLayout({ children }) { return children; }
