import { Suspense } from "react";
import ReelsContent from "./ReelsContent";

function LoadingFallback() {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100dvh",
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

export default function ReelsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ReelsContent />
    </Suspense>
  );
}