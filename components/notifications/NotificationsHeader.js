"use client";

import BrandHeader from "@/components/ui/BrandHeader";
import { BRAND, glass } from "@/components/ui/brand";

function UnreadPill({ count }) {
  return (
    <span style={{ ...glass, minWidth: 42, height: 42, padding: "0 12px", borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: count > 0 ? "#fff" : BRAND.faint, ...(count > 0 ? { background: BRAND.red, borderColor: BRAND.red, boxShadow: "0 6px 20px rgba(255,59,48,0.4)" } : {}) }}>
      {count}
    </span>
  );
}

export function NotificationsHeader({ unreadCount, onBack, t }) {
  return (
    <div style={{ maxWidth: 540, margin: "0 auto", padding: "0 16px" }}>
      <BrandHeader kicker="GAVANA" title={t("notifications")} onBack={onBack} right={<UnreadPill count={unreadCount} />} />
    </div>
  );
}

export function NotificationsLoadingHeader({ onBack, t }) {
  return (
    <div style={{ maxWidth: 540, margin: "0 auto", padding: "0 16px" }}>
      <BrandHeader kicker="GAVANA" title={t("notifications")} onBack={onBack} right={<UnreadPill count="—" />} />
    </div>
  );
}
