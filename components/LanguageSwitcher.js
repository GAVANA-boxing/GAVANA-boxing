"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { locales, getLocale } from "@/lib/i18n";
import { RED, GOLD , goldAlpha, RADIUS} from "@/lib/tokens";

const FLAG = { en: "🇺🇸", mn: "🇲🇳", ko: "🇰🇷" };
const CODE = { en: "EN", mn: "MN", ko: "KO" };

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
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={s.pill}
        aria-label="Switch language"
        aria-expanded={open}
      >
        <span style={s.code}>{CODE[activeLocale]}</span>
        <span style={{ ...s.chevron, transform: open ? "rotate(180deg)" : "none" }}>▾</span>
      </button>

      {open && (
        <div style={s.dropdown}>
          {locales.map((locale) => {
            const isActive = locale === activeLocale;
            return (
              <button
                key={locale}
                type="button"
                onClick={() => handleChange(locale)}
                style={{ ...s.option, ...(isActive ? s.optionActive : {}) }}
              >
                <span style={s.flag}>{FLAG[locale]}</span>
                <span style={{ ...s.code, fontSize: 12, color: isActive ? "#fff" : "rgba(255,255,255,0.6)" }}>
                  {CODE[locale]}
                </span>
                {isActive && <span style={s.dot} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
    height: 30,
    padding: "0 9px",
    borderRadius: RADIUS.full,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(8,8,8,0.78)",
    color: "#fff",
    cursor: "pointer",
    backdropFilter: "blur(20px) saturate(160%)",
    WebkitBackdropFilter: "blur(20px) saturate(160%)",
    boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
    transition: "background 150ms",
  },
  flag: { fontSize: 13, lineHeight: 1 },
  code: { fontSize: 10, fontWeight: 900, letterSpacing: "0.08em", color: "#fff" },
  chevron: {
    fontSize: 8,
    color: "rgba(255,255,255,0.35)",
    transition: "transform 180ms ease",
    lineHeight: 1,
  },
  dropdown: {
    display: "flex",
    flexDirection: "column",
    gap: 1,
    padding: 3,
    borderRadius: 12,
    background: "rgba(10,10,10,0.97)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    minWidth: 72,
    animation: "dropDown 140ms ease",
  },
  option: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "7px 9px",
    borderRadius: 8,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    transition: "background 100ms",
    width: "100%",
  },
  optionActive: {
    background: `${goldAlpha(0.1)}`,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: "50%",
    background: GOLD,
    marginLeft: "auto",
    flexShrink: 0,
  },
};
