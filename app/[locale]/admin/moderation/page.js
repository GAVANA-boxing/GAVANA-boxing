"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, query, orderBy, limit, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getLocale, translate } from "@/lib/i18n";
import BottomNav from "@/components/BottomNav";
import SkeletonBlock from "@/components/SkeletonBlock";
import { RED, GOLD, redAlpha } from "@/lib/tokens";

const ADMIN_UIDS = (process.env.NEXT_PUBLIC_ADMIN_UIDS || "").split(",").filter(Boolean);

const STATUS_COLORS = {
  pending:   GOLD,
  dismissed: "rgba(255,255,255,0.3)",
  actioned:  "#34D399",
};

const REASON_ICONS = {
  spam:       "🚫",
  violence:   "⚠️",
  harassment: "😠",
  misinform:  "❗",
  other:      "🚩",
};

function ReportCard({ report, onDismiss, onAction, locale }) {
  const age = report.createdAt ? Math.floor((Date.now() - new Date(report.createdAt).getTime()) / 60000) : null;
  const ageStr = age === null ? "" : age < 60 ? `${age}m ago` : `${Math.floor(age / 60)}h ago`;
  const statusColor = STATUS_COLORS[report.status] || "rgba(255,255,255,0.3)";

  return (
    <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>{REASON_ICONS[report.reason] || "🚩"}</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#fff" }}>
              {report.reason?.toUpperCase()} · <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>{report.targetType}</span>
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
              {report.targetId?.slice(0, 20)}… · {ageStr}
            </div>
          </div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 800, color: statusColor, padding: "2px 8px", borderRadius: 999, border: `1px solid ${statusColor}`, flexShrink: 0 }}>
          {report.status?.toUpperCase()}
        </span>
      </div>
      {report.note && (
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontStyle: "italic", padding: "8px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 8 }}>
          "{report.note}"
        </div>
      )}
      {report.status === "pending" && (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => onDismiss(report.id)}
            style={{ flex: 1, padding: "9px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            {locale === "mn" ? "Үгүйсгэх" : locale === "ko" ? "무시" : "Dismiss"}
          </button>
          <button
            type="button"
            onClick={() => onAction(report.id, report.targetId, report.targetType)}
            style={{ flex: 1, padding: "9px", borderRadius: 10, border: "none", background: redAlpha(0.2), color: "#F87171", fontSize: 12, fontWeight: 900, cursor: "pointer" }}
          >
            {locale === "mn" ? "Арга хэмжээ авах" : locale === "ko" ? "조치" : "Take Action"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ModerationPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  const isAdmin = user && (ADMIN_UIDS.includes(user.uid) || user.email?.endsWith("@gavana.app"));

  useEffect(() => {
    if (!authLoading && !user) { router.push(`/${locale}/login`); return; }
    if (!authLoading && user && !isAdmin) { router.push(`/${locale}/train`); return; }
  }, [authLoading, user, isAdmin, router, locale]);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const snap = await getDocs(
          query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(100))
        );
        if (!active) return;
        setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [isAdmin]);

  async function handleDismiss(reportId) {
    await updateDoc(doc(db, "reports", reportId), { status: "dismissed", reviewedAt: serverTimestamp() });
    setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status: "dismissed" } : r));
  }

  async function handleAction(reportId) {
    await updateDoc(doc(db, "reports", reportId), { status: "actioned", reviewedAt: serverTimestamp() });
    setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status: "actioned" } : r));
  }

  const filtered = reports.filter((r) => filter === "all" || r.status === filter);
  const counts = { pending: reports.filter((r) => r.status === "pending").length, all: reports.length };

  if (authLoading || (!user && !authLoading)) {
    return <div style={{ minHeight: "100dvh", background: "#070707" }} />;
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#070707", color: "#fff", paddingBottom: "calc(40px + env(safe-area-inset-bottom))" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(7,7,7,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button type="button" onClick={() => router.back()} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", padding: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: 1.5, textTransform: "uppercase" }}>Admin</p>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#fff" }}>
            {locale === "mn" ? "Хяналт" : locale === "ko" ? "관리" : "Moderation"}
          </h1>
        </div>
        {counts.pending > 0 && (
          <div style={{ marginLeft: "auto", background: RED, color: "#fff", fontSize: 12, fontWeight: 900, width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {counts.pending}
          </div>
        )}
      </header>

      <div style={{ padding: "12px 16px 0" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[
            { key: "pending", label: `Pending (${counts.pending})` },
            { key: "all",     label: `All (${counts.all})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              style={{ padding: "6px 14px", borderRadius: 999, border: `1px solid ${filter === key ? GOLD : "rgba(255,255,255,0.1)"}`, background: filter === key ? "rgba(212,175,55,0.1)" : "transparent", color: filter === key ? GOLD : "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3].map((i) => <SkeletonBlock key={i} height={100} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.3)" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              {locale === "mn" ? "Хянах зүйл алга" : locale === "ko" ? "처리할 항목 없음" : "Nothing to review"}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onDismiss={handleDismiss}
                onAction={handleAction}
                locale={locale}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />
    </div>
  );
}
