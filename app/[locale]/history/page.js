"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname } from "@/lib/i18n";
import { BRAND, pageBackground } from "@/components/ui/brand";
import HistoryView from "@/components/history/HistoryView";

function getTs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  return Number(ts) || 0;
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.uid) { router.replace(`/${locale}/login`); return; }
    let active = true;
    getDocs(query(collection(db, "training_sessions"), where("userId", "==", user.uid)))
      .then((snap) => {
        if (!active) return;
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((s) => s.type === "training" && s.score != null)
          .sort((a, b) => getTs(b.createdAt) - getTs(a.createdAt));
        setSessions(list);
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.uid, authLoading, locale, router]);

  const back = () => (window.history.length > 1 ? router.back() : router.push(`/${locale}/progress`));

  if (loading || authLoading) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: pageBackground }}>
        <div style={{ width: 28, height: 28, border: `2px solid ${BRAND.red}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return <HistoryView sessions={sessions} locale={locale} router={router} user={user} onBack={back} />;
}
