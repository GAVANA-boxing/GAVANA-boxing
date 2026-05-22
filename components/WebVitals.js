"use client";

import { useReportWebVitals } from "next/web-vitals";

export default function WebVitals() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV !== "production") return;
    const { name, value, rating } = metric;
    if (typeof window === "undefined" || !window.gtag) return;
    window.gtag("event", name, {
      value: Math.round(name === "CLS" ? value * 1000 : value),
      metric_rating: rating,
      non_interaction: true,
    });
  });
  return null;
}
