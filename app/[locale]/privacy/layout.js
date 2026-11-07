import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata(
  "/privacy",
  {"mn": "Нууцлалын бодлого", "ko": "개인정보처리방침", "en": "Privacy policy"},
  {"mn": "GAVANA таны мэдээллийг хэрхэн цуглуулж, хамгаалдаг вэ.", "ko": "GAVANA가 데이터를 수집하고 보호하는 방법.", "en": "How GAVANA collects, uses and protects your data."},
);

export default function PrivacyLayout({ children }) { return children; }
