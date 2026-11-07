// Per-locale page metadata: localized title + description, a canonical URL
// and hreflang alternates for the three languages. The root layout's title
// template appends " | GAVANA Boxing", so titles here are just the page name.

import { getLocale } from "@/lib/i18n";

const LOCALES = ["mn", "ko", "en"];

/**
 * @param {string} rawLocale  the [locale] param
 * @param {string} path       the route after the locale, e.g. "/train" ("" for the landing page)
 * @param {{mn:string,ko:string,en:string}} title
 * @param {{mn:string,ko:string,en:string}} description
 * @param {{ absoluteTitle?: boolean, noindex?: boolean }} [opts]
 */
export function localeMetadata(rawLocale, path, title, description, opts = {}) {
  const locale = getLocale(rawLocale);
  const t = title[locale] || title.en;
  const d = description[locale] || description.en;
  const languages = Object.fromEntries(LOCALES.map((l) => [l, `/${l}${path}`]));
  languages["x-default"] = `/mn${path}`;
  return {
    title: opts.absoluteTitle ? { absolute: t } : t,
    description: d,
    alternates: { canonical: `/${locale}${path}`, languages },
    openGraph: { title: t, description: d, type: "website", siteName: "GAVANA Boxing", locale },
    twitter: { card: "summary", title: t, description: d },
    ...(opts.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Builds a layout's generateMetadata for a route. */
export function routeMetadata(path, title, description, opts) {
  return async function generateMetadata({ params }) {
    const { locale } = await params;
    return localeMetadata(locale, path, title, description, opts);
  };
}
