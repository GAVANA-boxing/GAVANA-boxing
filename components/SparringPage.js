"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { useSparringActions } from "@/hooks/useSparringActions";
import BottomNav from "@/components/BottomNav";
import { loc } from "@/lib/loc";
import PageTopBar from "@/components/PageTopBar";
import s from "@/components/sparring/sparringStyles";
import { Toast, useToast } from "@/components/ui/Toast";
import { useSparringData } from "@/hooks/useSparringData";
import SparringTabBar from "@/components/sparring/SparringTabBar";
import DiscoverTab from "@/components/sparring/DiscoverTab";
import RequestsTab from "@/components/sparring/RequestsTab";
import MineTab from "@/components/sparring/MineTab";
import HistoryTab from "@/components/sparring/HistoryTab";

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function SparringPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);

  const [tab, setTab] = useState("discover");
  const [requestsSubTab, setRequestsSubTab] = useState("received");
  const [filterArchetype, setFilterArchetype] = useState("all");
  const [filterWeight, setFilterWeight] = useState("all");

  const {
    posts,
    myPost,
    incomingRequests,
    sentRequestToIds,
    sentRequests,
    userData,
    loading,
    matchHistory,
    historyLoading,
  } = useSparringData({ user, tab });

  const { toast, showToast, hideToast } = useToast();
  const { cancelling, toggling, requesting, accepting, declining, handleToggle, handleRequest, handleAccept, handleDecline, handleCancelSparringRequest } = useSparringActions({ user, router, locale, userData, myPost, onError: showToast });

  const filtered = posts.filter((p) => {
    if (filterArchetype !== "all" && p.archetype !== filterArchetype) return false;
    if (filterWeight !== "all" && !p.weightClass?.includes(filterWeight)) return false;
    return true;
  });

  const pendingIncoming = incomingRequests.filter((r) => r.status === "pending");
  const resolvedIncoming = incomingRequests.filter((r) => r.status !== "pending");

  if (authLoading || loading) {
    return (
      <div style={{ ...s.page, padding: "calc(60px + env(safe-area-inset-top)) 16px 16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map((i) => <div key={i} className="shimmer" style={{ height: 110, borderRadius: 14 }} />)}
        </div>
      </div>
    );
  }

  const isOn = !!myPost;

  const tabs = [
    { key: "discover", label: t("sparringTabDiscover") },
    { key: "requests", label: t("sparringTabRequests"), badge: pendingIncoming.length },
    { key: "mine",     label: t("sparringTabMine") },
    { key: "history",  label: t("sparringTabHistory") },
  ];

  return (
    <div style={s.page} className="page-enter cinematic-bg">

      <PageTopBar
        kicker="COMBAT · SPARRING"
        title={loc(locale, "СПАРРИНГ", "스파링", "SPARRING")}
        user={user}
        currentLocale={locale}
        showBack
      />

      <SparringTabBar tab={tab} setTab={setTab} tabs={tabs} />

      {/* ── DISCOVER TAB ── */}
      {tab === "discover" && (
        <DiscoverTab
          user={user}
          locale={locale}
          t={t}
          tab={tab}
          posts={posts}
          filtered={filtered}
          filterArchetype={filterArchetype}
          setFilterArchetype={setFilterArchetype}
          filterWeight={filterWeight}
          setFilterWeight={setFilterWeight}
          isOn={isOn}
          toggling={toggling}
          handleToggle={handleToggle}
          handleRequest={handleRequest}
          sentRequestToIds={sentRequestToIds}
          requesting={requesting}
        />
      )}

      {/* ── REQUESTS TAB ── */}
      {tab === "requests" && (
        <RequestsTab
          user={user}
          locale={locale}
          t={t}
          requestsSubTab={requestsSubTab}
          setRequestsSubTab={setRequestsSubTab}
          pendingIncoming={pendingIncoming}
          resolvedIncoming={resolvedIncoming}
          sentRequests={sentRequests}
          handleAccept={handleAccept}
          handleDecline={handleDecline}
          accepting={accepting}
          declining={declining}
          cancelling={cancelling}
          handleCancelSparringRequest={handleCancelSparringRequest}
        />
      )}

      {/* ── MINE TAB ── */}
      {tab === "mine" && (
        <MineTab
          user={user}
          locale={locale}
          t={t}
          myPost={myPost}
          isOn={isOn}
          toggling={toggling}
          handleToggle={handleToggle}
        />
      )}

      {/* ── HISTORY TAB ── */}
      {tab === "history" && (
        <HistoryTab
          locale={locale}
          t={t}
          matchHistory={matchHistory}
          historyLoading={historyLoading}
          router={router}
        />
      )}

      <Toast message={toast?.message} type={toast?.type} onDismiss={hideToast} />
      <BottomNav router={router} user={user} currentLocale={locale} activeTab="sparring" />
    </div>
  );
}
