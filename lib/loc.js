export const loc = (locale, mn, ko, en) =>
  locale === "mn" ? mn : locale === "ko" ? ko : en;

/**
 * Text that may be a plain string or a localized object { mn, ko, en } (lib/lessons/*, data
 * files) → the string for this locale. Never returns an object, so it is always safe to render.
 */
export const tx = (value, locale) => {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object") {
    const v = value[locale] ?? value.en ?? value.mn ?? value.ko;
    return typeof v === "string" || typeof v === "number" ? String(v) : "";
  }
  return "";
};
