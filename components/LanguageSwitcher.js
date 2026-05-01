"use client";

import { usePathname, useRouter } from "next/navigation";
import { localeNames, locales, getLocale, translate } from "@/lib/i18n";

export default function LanguageSwitcher({ currentLocale }) {
  const router = useRouter();
  const pathname = usePathname();
  const activeLocale = getLocale(currentLocale || pathname?.split("/")[1]);

  const handleChange = (nextLocale) => {
    const segments = (pathname || "/").split("/");

    if (locales.includes(segments[1])) {
      segments[1] = nextLocale;
      router.push(segments.join("/") || `/${nextLocale}`);
      return;
    }

    router.push(`/${nextLocale}${pathname === "/" ? "" : pathname}`);
  };

  return (
    <div style={styles.wrap} aria-label={translate(activeLocale, "language")}>
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => handleChange(locale)}
          style={{
            ...styles.button,
            ...(locale === activeLocale ? styles.buttonActive : {}),
          }}
          title={localeNames[locale]}
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

const styles = {
  wrap: {
    position: "fixed",
    top: "calc(12px + env(safe-area-inset-top))",
    right: "max(12px, env(safe-area-inset-right))",
    zIndex: 1400,
    display: "flex",
    gap: 4,
    padding: 4,
    borderRadius: 999,
    background: "rgba(11,11,11,0.68)",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 16px 40px rgba(0,0,0,0.34)",
    backdropFilter: "blur(18px) saturate(150%)",
    WebkitBackdropFilter: "blur(18px) saturate(150%)",
  },
  button: {
    minWidth: 36,
    height: 28,
    border: "none",
    borderRadius: 999,
    background: "transparent",
    color: "rgba(255,255,255,0.66)",
    fontSize: 11,
    fontWeight: 900,
    cursor: "pointer",
    transition: "background 180ms ease, color 180ms ease, transform 180ms ease",
  },
  buttonActive: {
    background: "rgba(193,18,31,0.86)",
    color: "#fff",
    boxShadow: "0 0 18px rgba(193,18,31,0.34)",
  },
};
