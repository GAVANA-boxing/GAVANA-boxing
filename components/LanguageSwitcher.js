"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { localeNames, locales, getLocale } from "@/lib/i18n";

export default function LanguageSwitcher({ currentLocale }) {
  const router = useRouter();
  const pathname = usePathname();
  const activeLocale = getLocale(currentLocale || pathname?.split("/")[1]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const handleChange = (nextLocale) => {
    if (nextLocale === activeLocale) { setOpen(false); return; }
    const segments = (pathname || "/").split("/");
    if (locales.includes(segments[1])) {
      segments[1] = nextLocale;
      router.push(segments.join("/") || `/${nextLocale}`);
    } else {
      router.push(`/${nextLocale}${pathname === "/" ? "" : pathname}`);
    }
    setOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("touchstart", onOutside);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("touchstart", onOutside);
    };
  }, [open]);

  return (
    <div ref={ref} style={s.wrap}>
      {/* Current locale pill — always visible */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={s.pill}
        aria-label="Switch language"
        aria-expanded={open}
      >
        <span style={s.pillFlag}>{FLAG[activeLocale]}</span>
        <span style={s.pillLabel}>{activeLocale.toUpperCase()}</span>
        <span style={{ ...s.chevron, transform: open ? "rotate(180deg)" : "none" }}>▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={s.dropdown}>
          {locales.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => handleChange(locale)}
              style={{
                ...s.option,
                ...(locale === activeLocale ? s.optionActive : {}),
              }}
            >
              <span style={s.optionFlag}>{FLAG[locale]}</span>
              <span style={s.optionName}>{localeNames[locale]}</span>
              {locale === activeLocale && <span style={s.check}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const FLAG = { en: "🇺🇸", mn: "🇲🇳", ko: "🇰🇷" };

const s = {
  wrap: {
    position: "fixed",
    top: "calc(10px + env(safe-area-inset-top))",
    right: "max(12px, env(safe-area-inset-right))",
    zIndex: 1400,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 4,
  },
  pill: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    height: 32,
    padding: "0 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(11,11,11,0.72)",
    color: "#fff",
    fontSize: 11,
    fontWeight: 800,
    cursor: "pointer",
    backdropFilter: "blur(18px) saturate(150%)",
    WebkitBackdropFilter: "blur(18px) saturate(150%)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
    letterSpacing: "0.04em",
    transition: "background 150ms",
  },
  pillFlag: { fontSize: 14, lineHeight: 1 },
  pillLabel: { fontSize: 11, fontWeight: 900 },
  chevron: {
    fontSize: 9,
    color: "#888",
    transition: "transform 180ms ease",
    lineHeight: 1,
  },
  dropdown: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    padding: 4,
    borderRadius: 14,
    background: "rgba(14,14,14,0.96)",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    minWidth: 130,
    animation: "dropDown 140ms ease",
  },
  option: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    borderRadius: 10,
    border: "none",
    background: "transparent",
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    transition: "background 120ms",
  },
  optionActive: {
    background: "rgba(193,18,31,0.18)",
    color: "#fff",
  },
  optionFlag: { fontSize: 16, lineHeight: 1, flexShrink: 0 },
  optionName: { flex: 1 },
  check: { fontSize: 12, color: "#C1121F", fontWeight: 900 },
};
