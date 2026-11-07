import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata(
  "/coach",
  {"mn": "Дасгалжуулагч", "ko": "코치", "en": "Coach"},
  {"mn": "AI дасгалжуулагчтай чатла, техникээ асуу, өөрт тохирсон дасгал ав.", "ko": "AI 코치와 대화하고 기술을 묻고 맞춤 드릴을 받으세요.", "en": "Chat with your AI corner coach, ask about technique and get drills made for you."},
);

export default function CoachLayout({ children }) { return children; }
