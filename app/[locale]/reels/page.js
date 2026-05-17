import { Suspense } from "react";
import ReelsContent from "@/app/reels/ReelsContent";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function LoadingFallback() {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "#000",
    }} />
  );
}

export default function LocalizedReelsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ReelsContent />
    </Suspense>
  );
}
