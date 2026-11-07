"use client";

import { usePathname } from "next/navigation";
import { BRAND, btnPrimary, btnSecondary, displayTitle, kickerDot, kickerPill, pageBackground } from "@/components/ui/brand";

/** Locale for error boundaries (they get no params): from the URL, so server and client agree. */
export function errorLocale(pathname) {
  const m = String(pathname || "").match(/^\/(mn|ko|en)(\/|$)/);
  return m ? m[1] : "mn";
}

const T = {
  mn: { kicker: "Алдаа", title: "Ямар нэг юм буруудлаа", retry: "Дахин оролдох", home: "Нүүр хуудас" },
  ko: { kicker: "오류", title: "문제가 발생했어요", retry: "다시 시도", home: "홈으로" },
  en: { kicker: "Error", title: "Something went wrong", retry: "Try again", home: "Go home" },
};

/**
 * Shared error screen for the route error boundaries.
 * @param {{ reset?: () => void, message?: { mn: string, ko: string, en: string } }} props
 */
export default function ErrorScreen({ reset, message }) {
  const locale = errorLocale(usePathname());
  const t = T[locale];
  const sub = message?.[locale] || message?.en;
  return (
    <main style={{ minHeight: "100dvh", background: pageBackground, color: BRAND.text, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        <p style={{ ...kickerPill, margin: "0 auto" }}><span style={kickerDot} />{t.kicker}</p>
        <h1 style={{ ...displayTitle, fontSize: 34, lineHeight: 1.1, marginTop: 16 }}>{t.title}</h1>
        {sub && <p style={{ margin: "12px 0 0", fontSize: 15, lineHeight: 1.5, color: BRAND.muted }}>{sub}</p>}
        <div style={{ display: "grid", gap: 10, marginTop: 24 }}>
          {reset && <button type="button" onClick={() => reset()} style={{ ...btnPrimary, fontFamily: "inherit" }}>↻ {t.retry}</button>}
          <button type="button" onClick={() => { window.location.href = `/${locale}/home`; }} style={{ ...btnSecondary, fontFamily: "inherit" }}>{t.home}</button>
        </div>
      </div>
    </main>
  );
}
