"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import StoryUpload from "@/components/StoryUpload";
import { getLocaleFromPathname } from "@/lib/i18n";

export const dynamic = "force-dynamic";

function StoryUploadInner() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "training_clip";

  return <StoryUpload locale={locale} initialType={type} />;
}

export default function StoryUploadPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#0A0A0A" }} />}>
      <StoryUploadInner />
    </Suspense>
  );
}
