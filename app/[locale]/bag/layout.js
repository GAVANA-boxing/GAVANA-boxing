import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata(
  "/bag",
  { mn: "Хүнд уут", ko: "헤비백", en: "Heavy bag" },
  { mn: "Камерын өмнө цохь — физиктэй 3D уут цохилт бүрт савлаж хонхойно.", ko: "카메라 앞에서 치면 물리 3D 헤비백이 흔들리고 들어갑니다.", en: "Punch at the camera — a physics 3D heavy bag swings and dents with every shot." },
);

export default function BagLayout({ children }) { return children; }
