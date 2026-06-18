import en from "@/lib/locales/en";
import mn from "@/lib/locales/mn";
import ko from "@/lib/locales/ko";

export const locales = ["en", "mn", "ko"];

export const localeNames = {
  en: "English",
  mn: "Монгол",
  ko: "한국어",
};

const translations = { en, mn, ko };

export function getLocale(locale) {
  return locales.includes(locale) ? locale : "en";
}

export function getLocaleFromPathname(pathname) {
  const segment = pathname?.split("/")?.[1];
  return getLocale(segment);
}

export function getTranslations(locale) {
  const safeLocale = getLocale(locale);
  return translations[safeLocale];
}

export function translate(locale, key) {
  return getTranslations(locale)[key] || translations.en[key] || key;
}

export function getLocal(field, locale) {
  if (!field) return "";
  if (typeof field === "object" && !Array.isArray(field)) return field[locale] || field.en || "";
  return field;
}
