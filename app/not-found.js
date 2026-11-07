"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND, btnPrimary, displayTitle, kickerDot, kickerPill, pageBackground } from "@/components/ui/brand";

const T = {
  mn: { kicker: "Алдаа 404", title: "Хуудас олдсонгүй", sub: "Энэ холбоос буруу эсвэл хуудас нь хасагдсан байна.", back: "Нүүр хуудас руу" },
  ko: { kicker: "오류 404", title: "페이지를 찾을 수 없어요", sub: "링크가 잘못됐거나 페이지가 삭제됐어요.", back: "홈으로" },
  en: { kicker: "Error 404", title: "Page not found", sub: "The link is wrong or the page was removed.", back: "Go home" },
};

/** Root 404. The locale isn't passed to the root not-found, so read it from the URL. */
export default function NotFound() {
  const pathname = usePathname() || "";
  const locale = (pathname.match(/^\/(mn|ko|en)(\/|$)/) || [])[1] || "mn";
  const t = T[locale];

  return (
    <main style={{ minHeight: "100dvh", background: pageBackground, color: BRAND.text, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        <p style={{ ...kickerPill, margin: "0 auto" }}><span style={kickerDot} />{t.kicker}</p>
        <h1 style={{ ...displayTitle, fontSize: 34, lineHeight: 1.1, marginTop: 16 }}>{t.title}</h1>
        <p style={{ margin: "12px 0 24px", fontSize: 15, lineHeight: 1.5, color: BRAND.muted }}>{t.sub}</p>
        <Link href={`/${locale}/home`} style={{ ...btnPrimary, textDecoration: "none" }}>{t.back} →</Link>
      </div>
    </main>
  );
}
