"use client";

import { useEffect } from "react";
import { funnel, funnelAppOpened } from "@/lib/funnel";

/**
 * Renders nothing — fires a funnel step on mount. Lets server components
 * (landing page, root layout) record funnel events.
 *   <FunnelBeacon step="landing_viewed" />   one step on mount
 *   <FunnelBeacon appOpened />                app_opened, at most once per day
 */
export default function FunnelBeacon({ step, appOpened = false, locale }) {
  useEffect(() => {
    if (appOpened) funnelAppOpened();
    if (step) funnel(step, { locale });
  }, [step, appOpened, locale]);
  return null;
}
