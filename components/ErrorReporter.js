"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/track";

// Sends uncaught browser errors to our own analytics (lib/track.js) so problems after launch
// show up without a third-party monitoring service.
export default function ErrorReporter() {
  useEffect(() => {
    const onError = (e) => reportClientError(e?.error || e?.message, "window");
    const onRejection = (e) => reportClientError(e?.reason, "promise");
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
