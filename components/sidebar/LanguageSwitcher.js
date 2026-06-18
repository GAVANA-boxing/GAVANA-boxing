"use client";

import { useRouter } from "next/navigation";
import { locales } from "@/lib/i18n";
import { RED, redAlpha } from "@/lib/tokens";

const SUPPORTED_LANGS = ["mn", "en", "ko"];
const SECTION_LABEL   = "Language";

const s = {
  wrapper: {
    padding: "10px 8px 6px",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    marginTop: 4,
  },
  heading: {
    fontSize: 8,
    fontWeight: 900,
    color: "rgba(255,255,255,0.28)",
    letterSpacing: 2,
    textTransform: "uppercase",
    paddingLeft: 2,
    marginBottom: 6,
  },
  row: { display: "flex", gap: 4 },
};

function langBtnStyle(active) {
  return {
    flex: 1,
    padding: "5px 0",
    borderRadius: 7,
    border: active ? `1px solid ${redAlpha(0.45)}` : "1px solid transparent",
    background: active ? redAlpha(0.15) : "rgba(255,255,255,0.04)",
    color: active ? RED : "rgba(255,255,255,0.3)",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "background 140ms, color 140ms, border-color 140ms",
    boxShadow: active ? `0 0 8px ${redAlpha(0.18)}` : "none",
  };
}

export default function LanguageSwitcher({ currentLocale, pathname }) {
  const router = useRouter();

  return (
    <div style={s.wrapper}>
      <div style={s.heading}>{SECTION_LABEL}</div>
      <div style={s.row}>
        {SUPPORTED_LANGS.map((lng) => {
          const active = currentLocale === lng;
          const segments = (pathname || "/").split("/");
          const target = locales.includes(segments[1])
            ? segments.map((seg, i) => (i === 1 ? lng : seg)).join("/") || `/${lng}`
            : `/${lng}${pathname === "/" ? "" : pathname}`;
          return (
            <button
              key={lng}
              onClick={() => router.push(target)}
              style={langBtnStyle(active)}
            >
              {lng.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
