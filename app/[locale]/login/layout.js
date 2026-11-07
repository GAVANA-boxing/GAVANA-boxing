import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata(
  "/login",
  {"mn": "Нэвтрэх", "ko": "로그인", "en": "Sign in"},
  {"mn": "GAVANA-д нэвтэрч бэлтгэл, оноо, цолоо хадгал.", "ko": "GAVANA에 로그인해 훈련, 점수, 등급을 저장하세요.", "en": "Sign in to GAVANA to save your rounds, scores and rank."},
);

export default function LoginLayout({ children }) { return children; }
