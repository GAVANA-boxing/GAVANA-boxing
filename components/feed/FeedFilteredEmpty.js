"use client";

import { loc } from "@/lib/loc";
import FilterTabBar from "./FilterTabBar";

const EMPTY_COPY = {
  following: {
    icon: "👥",
    mn: "Дагасан хүмүүсийнхээ нийтлэлийг энд харна уу",
    ko: "팔로우한 파이터들의 게시물이 여기 표시됩니다",
    en: "Follow fighters to see their posts here",
  },
  style: {
    icon: "🧬",
    mn: "Таны стилийн контент одоохондоо алга",
    ko: "내 스타일 콘텐츠가 아직 없습니다",
    en: "No content matching your style yet",
  },
};

/**
 * FeedFilteredEmpty
 *
 * Shown when the "Following" or "My Style" filter yields no results, or while
 * Following data is still loading.
 *
 * Props:
 *   locale           – "mn" | "ko" | "en"
 *   router           – Next.js router
 *   tabs             – tab array passed through to FilterTabBar
 *   activeFilter     – "following" | "style"
 *   setActiveFilter  – (key: string) => void
 *   isLoading        – boolean — true while followingReels are being fetched
 */
export default function FeedFilteredEmpty({ locale, router, tabs, activeFilter, setActiveFilter, isLoading }) {
  const copy = EMPTY_COPY[activeFilter] || EMPTY_COPY.style;

  if (isLoading) {
    return (
      <>
        <FilterTabBar tabs={tabs} activeFilter={activeFilter} setActiveFilter={setActiveFilter} locale={locale} />
        <div style={{ height: "100dvh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            width: 28,
            height: 28,
            border: "2px solid rgba(255,255,255,0.1)",
            borderTopColor: "rgba(255,255,255,0.55)",
            borderRadius: "50%",
            animation: "spin 0.75s linear infinite",
          }} />
        </div>
      </>
    );
  }

  return (
    <>
      <FilterTabBar tabs={tabs} activeFilter={activeFilter} setActiveFilter={setActiveFilter} locale={locale} />
      <div style={{
        height: "100dvh",
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: "0 32px",
        textAlign: "center",
      }}>
        <span style={{ fontSize: 32 }}>{copy.icon}</span>
        <div style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.7)" }}>
          {loc(locale, copy.mn, copy.ko, copy.en)}
        </div>
        {activeFilter === "following" && (
          <button
            type="button"
            onClick={() => router.push(`/${locale}/discover`)}
            style={{ padding: "8px 20px", borderRadius: 20, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
          >
            {loc(locale, "Хүмүүс хайх", "사람 찾기", "Find People")}
          </button>
        )}
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          style={{ padding: "8px 20px", borderRadius: 20, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
        >
          {loc(locale, "Бүгдийг үзэх", "전체 보기", "See All")}
        </button>
      </div>
    </>
  );
}
