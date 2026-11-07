import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata(
  "/onboarding",
  {"mn": "Эхлэх", "ko": "시작하기", "en": "Get started"},
  {"mn": "Тулаанчийн профайлаа тохируул.", "ko": "파이터 프로필을 설정하세요.", "en": "Set up your fighter profile."}, { noindex: true },
);

export default function OnboardingLayout({ children }) { return children; }
