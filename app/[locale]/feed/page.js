"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getLocale } from "@/lib/i18n";
import { getFeedReels } from "@/lib/feed";
import FeedPage from "@/components/feed/FeedPage";
import FeedEmptyState from "@/components/feed/FeedEmptyState";
import BottomNav from "@/components/BottomNav";

function FeedSkeleton() {
  return (
    <div style={{
      height: "100dvh",
      background: "#000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{
        width: 32, height: 32,
        border: "2px solid rgba(255,255,255,0.1)",
        borderTopColor: "rgba(255,255,255,0.55)",
        borderRadius: "50%",
        animation: "spin 0.75s linear infinite",
      }} />
    </div>
  );
}

export default function FeedRoute() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const locale   = getLocale(params?.locale);

  const [reels,   setReels]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getFeedReels(20)
      .then((data) => {
        if (!cancelled) {
          setReels(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("[Feed] failed to load reels:", err);
          setError(err);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  return (
    <>
      {/* Full-screen feed — no padding, no shell */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, background: "#000" }}>
        {loading ? (
          <FeedSkeleton />
        ) : error ? (
          <FeedEmptyState locale={locale} router={router} />
        ) : (
          <FeedPage reels={reels} locale={locale} router={router} />
        )}
      </div>

      {/* Bottom nav floats above feed */}
      <BottomNav router={router} user={user} currentLocale={locale} activeTab="feed" />
    </>
  );
}
