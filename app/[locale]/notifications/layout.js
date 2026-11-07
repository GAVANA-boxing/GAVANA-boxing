import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata(
  "/notifications",
  {"mn": "Мэдэгдэл", "ko": "알림", "en": "Notifications"},
  {"mn": "Таны мэдэгдлүүд.", "ko": "내 알림.", "en": "Your notifications."}, { noindex: true },
);

export default function NotificationsLayout({ children }) { return children; }
