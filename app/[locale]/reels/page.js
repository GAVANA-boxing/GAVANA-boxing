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
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
      fontSize: 16,
    }}>
      Loading reels...
    </div>
  );
}

export default function LocalizedReelsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ReelsContent />
    </Suspense>
  );
}
