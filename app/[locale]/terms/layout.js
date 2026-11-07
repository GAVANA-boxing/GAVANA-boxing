import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata(
  "/terms",
  {"mn": "Үйлчилгээний нөхцөл", "ko": "이용약관", "en": "Terms of service"},
  {"mn": "GAVANA ашиглах нөхцөл.", "ko": "GAVANA 이용 약관.", "en": "The terms for using GAVANA."},
);

export default function TermsLayout({ children }) { return children; }
