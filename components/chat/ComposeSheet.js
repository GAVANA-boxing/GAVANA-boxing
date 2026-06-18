"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { BORDER_2, RADIUS, blackAlpha, whiteAlpha } from "@/lib/tokens";
import { loc } from "@/lib/loc";

/**
 * Props:
 *   locale         – "mn" | "ko" | "en"
 *   search         – string (controlled)
 *   onSearchChange – (value: string) => void
 *   searching      – boolean
 *   searchResults  – user[]
 *   starting       – uid | null  (uid of the row that is loading)
 *   onSelect       – (user) => void
 *   onClose        – () => void
 */
export default function ComposeSheet({
  locale,
  search,
  onSearchChange,
  searching,
  searchResults,
  starting,
  onSelect,
  onClose,
}) {
  const searchRef = useRef(null);

  const newMsg           = loc(locale, "Шинэ мессеж", "새 메시지", "New Message");
  const placeholder      = loc(locale, "Username хайх…", "유저 검색…", "Search by username…");
  const noResults        = loc(locale, "Хэрэглэгч олдсонгүй", "사용자를 찾을 수 없습니다", "No users found");
  const hint             = loc(locale, "Username оруулж хэрэглэгч хайна уу", "유저명을 입력하세요", "Type a username to find fighters and coaches");
  const coachLabel       = loc(locale, "Coach", "코치", "Coach");

  // Auto-focus search input when sheet mounts
  useEffect(() => {
    const t = setTimeout(() => searchRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={s.handle} />

        <div style={s.header}>
          <span style={s.title}>{newMsg}</span>
          <button type="button" aria-label="Close" onClick={onClose} style={s.closeBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={s.searchWrap}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            style={s.searchInput}
          />
          {searching && <div style={s.spinner} />}
        </div>

        <div style={s.results}>
          {!search.trim() && (
            <p style={s.hint}>{hint}</p>
          )}
          {search.trim() && !searching && searchResults.length === 0 && (
            <p style={s.hint}>{noResults}</p>
          )}
          {searchResults.map((u) => {
            const isCoach = u.isCoach || u.coachVerified;
            return (
              <button
                key={u.id}
                type="button"
                disabled={!!starting}
                onClick={() => onSelect(u)}
                style={s.userRow}
              >
                <div style={{ position: "relative", flexShrink: 0 }}>
                  {u.photoURL || u.profileImageUrl
                    ? <Image
                        src={u.photoURL || u.profileImageUrl}
                        alt=""
                        width={42}
                        height={42}
                        style={{
                          borderRadius: "50%", objectFit: "cover",
                          border: isCoach ? "2px solid #F5C451" : "none",
                        }}
                      />
                    : <div style={{
                        width: 42, height: 42, borderRadius: "50%",
                        background: "#1a1a1a",
                        border: isCoach ? "2px solid #F5C451" : "1px solid rgba(255,255,255,0.1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, fontWeight: 900, color: "#fff",
                      }}>
                        {(u.displayName || u.username || "?").charAt(0).toUpperCase()}
                      </div>
                  }
                </div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>
                    {u.displayName || u.username}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", marginTop: 1 }}>
                    @{u.username}{isCoach ? ` · ${coachLabel}` : ""}
                  </div>
                </div>
                {starting === u.id
                  ? <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>…</span>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
                }
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 200,
    background: blackAlpha(0.7), backdropFilter: "blur(8px)",
    display: "flex", alignItems: "flex-end",
  },
  sheet: {
    width: "100%", maxHeight: "85dvh",
    background: "#0d0d0f", borderRadius: "24px 24px 0 0",
    border: `1px solid ${BORDER_2}`, borderBottom: "none",
    display: "flex", flexDirection: "column",
    animation: "sheetUp 0.28s cubic-bezier(0.25,0.46,0.45,0.94) forwards",
    paddingBottom: "env(safe-area-inset-bottom)",
  },
  handle: { width: 36, height: 4, borderRadius: 2, background: whiteAlpha(0.18), margin: "12px auto 0" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px 10px" },
  title: { fontSize: 15, fontWeight: 950, color: "#fff" },
  closeBtn: {
    width: 32, height: 32, borderRadius: "50%",
    border: `1px solid ${BORDER_2}`, background: whiteAlpha(0.05),
    color: whiteAlpha(0.6), cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  searchWrap: {
    display: "flex", alignItems: "center", gap: 10,
    margin: "0 16px 6px", padding: "11px 14px",
    borderRadius: RADIUS.md, background: whiteAlpha(0.05), border: `1px solid ${BORDER_2}`,
  },
  searchInput: { flex: 1, background: "none", border: "none", outline: "none", color: "#fff", fontSize: 14 },
  spinner: {
    width: 14, height: 14, borderRadius: "50%",
    border: `2px solid ${whiteAlpha(0.15)}`, borderTopColor: whiteAlpha(0.6),
    animation: "spin 0.7s linear infinite", flexShrink: 0,
  },
  results: { flex: 1, overflowY: "auto", padding: "4px 0 12px" },
  hint: { margin: "24px 0", fontSize: 13, color: whiteAlpha(0.3), textAlign: "center" },
  userRow: {
    display: "flex", alignItems: "center", gap: 12, padding: "11px 18px",
    width: "100%", background: "none", border: "none",
    cursor: "pointer", WebkitTapHighlightColor: "transparent",
  },
};
