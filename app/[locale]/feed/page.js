"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getLocale } from "@/lib/i18n";
import { getFeedReels, getFollowingReels } from "@/lib/feed";
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

  const [reels,           setReels]           = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [userArchetype,   setUserArchetype]   = useState(null);
  const [followingReels,  setFollowingReels]  = useState([]);
  const [followingLoaded, setFollowingLoaded] = useState(false);

  const lastLoadRef    = useRef(Date.now());
  const archetypeRef   = useRef(null);

  const loadFeed = async (cancelled, archKey = null) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFeedReels(20, archKey);
      if (!cancelled) {
        setReels(data);
        lastLoadRef.current = Date.now();
        setLoading(false);
      }
    } catch (err) {
      if (!cancelled) {
        console.error("[Feed] failed to load reels:", err);
        setError(err);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;
    loadFeed(cancelled, archetypeRef.current);

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && Date.now() - lastLoadRef.current > 5 * 60 * 1000) {
        loadFeed(cancelled, archetypeRef.current);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    (async () => {
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const snap = await getDoc(doc(db, "users", user.uid));
        if (active && snap.exists()) {
          const arch = snap.data()?.fighterDNA?.archetypeKey;
          if (arch) {
            setUserArchetype(arch);
            if (!archetypeRef.current) {
              archetypeRef.current = arch;
              loadFeed(false, arch);
            }
          }
        }
      } catch { /* silent */ }
    })();
    return () => { active = false; };
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    (async () => {
      try {
        const data = await getFollowingReels(user.uid, 30);
        if (active) { setFollowingReels(data); setFollowingLoaded(true); }
      } catch { if (active) setFollowingLoaded(true); }
    })();
    return () => { active = false; };
  }, [user?.uid]);

  return (
    <>
      {/* Full-screen feed — no padding, no shell */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, background: "#000" }}>
        {loading ? (
          <FeedSkeleton />
        ) : error ? (
          <FeedEmptyState locale={locale} router={router} />
        ) : (
          <FeedPage reels={reels} locale={locale} router={router} user={user} userArchetype={userArchetype} followingReels={followingReels} followingLoaded={followingLoaded} />
        )}
      </div>

      {/* Bottom nav floats above feed */}
      <BottomNav router={router} user={user} currentLocale={locale} activeTab="feed" />
    </>
  );
}
