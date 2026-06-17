export const loc = (locale, mn, ko, en) =>
  locale === "mn" ? mn : locale === "ko" ? ko : en;
