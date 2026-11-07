"use client";

import { useEffect } from "react";

/**
 * The root layout can't see the [locale] segment, so <html lang> was "en"
 * on every page — screen readers then read Mongolian and Korean with an
 * English voice. Set it from the route once the page is on screen.
 * (Done client-side on purpose: reading the locale on the server would make
 * every page dynamic.)
 */
export default function HtmlLang({ locale }) {
  useEffect(() => {
    if (locale && document.documentElement.lang !== locale) document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
