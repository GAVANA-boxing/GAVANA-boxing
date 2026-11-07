import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata(
  "/tour",
  { mn: "World Tour", ko: "월드 투어", en: "World Tour" },
  { mn: "Зэрэг ахих тусам Улаанбаатараас Лас Вегас хүртэл — хот бүр бодит цаг, нар, улиралтайгаа 3D-ээр.", ko: "랭크가 오를수록 울란바토르에서 라스베이거스까지 — 실제 시간·태양·계절의 3D 도시.", en: "Rank up from Ulaanbaatar to Las Vegas — every city in 3D with its real time, sun and season." },
);

export default function TourLayout({ children }) { return children; }
