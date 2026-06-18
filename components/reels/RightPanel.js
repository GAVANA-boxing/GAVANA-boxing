"use client";
import { useState, useEffect } from "react";
import { RED, GOLD } from "@/lib/tokens";
import { FALLBACK_SPARRING } from "@/lib/reelConstants";
import { IcoSearch } from "@/components/reels/DashboardIcons";
import SkeletonRow from "@/components/reels/SkeletonRow";
import CoachSection from "@/components/reels/CoachSection";
import GymSection from "@/components/reels/GymSection";
import d from "@/components/reels/reelsDashboardStyles";

export default function RightPanel({ user, router, currentLocale }) {
  const [sparring, setSparring] = useState(null);
  const [requests, setRequests] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { db } = await import("@/lib/firebase");
        const { collection, query, where, orderBy, limit, getDocs } = await import("firebase/firestore");
        if (!db) { setSparring([]); setRequests([]); return; }

        const [sparringSnap, reqSnap] = await Promise.all([
          getDocs(query(
            collection(db, "sparring_posts"),
            where("lookingForSparring", "==", true),
            orderBy("createdAt", "desc"),
            limit(5)
          )).catch(() => ({ docs: [] })),
          user?.uid ? getDocs(query(
            collection(db, "sparring_requests"),
            where("fromUserId", "==", user.uid),
            orderBy("createdAt", "desc"),
            limit(4)
          )).catch(() => ({ docs: [] })) : Promise.resolve({ docs: [] }),
        ]);

        setSparring(sparringSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setRequests(reqSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (_) {
        setSparring([]);
        setRequests([]);
      }
    }
    load();
  }, [user]);

  const displaySparring = sparring === null ? null : sparring.length > 0 ? sparring : FALLBACK_SPARRING;
  const isLoading = sparring === null;

  return (
    <aside style={d.rightPanel}>
      {/* Search */}
      <div style={d.searchBar}>
        <span style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }}><IcoSearch /></span>
        <input
          placeholder="ТУЛААНЧ, ЗААЛ ХАЙХ..."
          style={d.searchInput}
          readOnly
          onClick={() => router.push(`/${currentLocale}/discover`)}
        />
      </div>

      {/* Sparring Lobby */}
      <div style={d.rightCard}>
        <div style={d.rightCardHeader}>
          <span style={d.liveDot} className="live-pulse" />
          <span style={d.rightCardTitle}>СПАРРИНГ ЛОББИ</span>
          <span style={d.liveBadge}>{isLoading ? "—" : `${displaySparring?.length || 0} LIVE`}</span>
        </div>

        <div className="no-scrollbar" style={d.hScroll}>
          {isLoading ? (
            [0,1,2].map((i) => (
              <div key={i} style={{ ...d.sparringCard, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ ...d.skeletonPulse, width: 7, height: 7, borderRadius: "50%", marginBottom: 6 }} />
                <div style={{ ...d.skeletonPulse, height: 9, width: "70%", borderRadius: 5, marginBottom: 4 }} />
                <div style={{ ...d.skeletonPulse, height: 11, width: "85%", borderRadius: 5, marginBottom: 4 }} />
                <div style={{ ...d.skeletonPulse, height: 9, width: "60%", borderRadius: 5, marginBottom: 6 }} />
                <div style={{ ...d.skeletonPulse, width: 52, height: 22, borderRadius: 7 }} />
              </div>
            ))
          ) : displaySparring.map((item) => (
            <div
              key={item.id}
              style={d.sparringCard}
              onClick={() => router.push(`/${currentLocale}/sparring`)}
            >
              <div style={d.sparringCardDot} />
              <div style={{ ...d.sparringCardWeight, color: RED }}>
                {item.weightClass || "—"}
              </div>
              <div style={d.sparringCardName}>
                {(item.displayName || item.fromName || "Тулаанч").toUpperCase()}
              </div>
              <div style={d.sparringCardMeta}>
                {item.location || item.gym || ""}
              </div>
              <div style={d.sparringCardJoin}>НЭГДЭХ</div>
            </div>
          ))}
        </div>

        <button style={d.viewAllBtn} onClick={() => router.push(`/${currentLocale}/sparring`)}>
          БҮГДИЙГ ХАРАХ →
        </button>
      </div>

      <CoachSection router={router} currentLocale={currentLocale} />
      <GymSection router={router} currentLocale={currentLocale} />

      {/* My Requests */}
      {user && (
        <div style={d.rightCard}>
          <div style={d.rightCardHeader}>
            <div style={{ ...d.liveDot, background: GOLD, boxShadow: `0 0 7px ${GOLD}` }} />
            <span style={d.rightCardTitle}>МИНИЙ ХҮСЭЛТ</span>
          </div>

          {requests === null ? (
            <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
              {[0,1].map((i) => <SkeletonRow key={i} />)}
            </div>
          ) : requests.length === 0 ? (
            <div style={d.rightEmpty}>{currentLocale === "mn" ? "Одоогоор илгээсэн хүсэлт байхгүй байна" : currentLocale === "ko" ? "보낸 요청이 없습니다" : "No requests sent yet"}</div>
          ) : (
            requests.map((req) => {
              const isAccepted = req.status === "accepted";
              const isDeclined = req.status === "declined";
              const color = isAccepted ? "#34D399" : isDeclined ? "#F87171" : "#F59E0B";
              const bg = isAccepted ? "rgba(52,211,153,0.1)" : isDeclined ? "rgba(248,113,113,0.1)" : "rgba(245,158,11,0.08)";
              const border = isAccepted ? "rgba(52,211,153,0.25)" : isDeclined ? "rgba(248,113,113,0.25)" : "rgba(245,158,11,0.22)";
              const label = isAccepted ? "ЗӨВШӨӨРСӨН" : isDeclined ? "ТАТГАЛЗСАН" : "ХҮЛЭЭЖ БАЙНА";
              return (
                <div key={req.id} style={d.requestRow}>
                  <span style={d.requestTo}>{(req.toDisplayName || req.toName || "Тулаанч").toUpperCase()}</span>
                  <span style={{ ...d.statusBadge, color, background: bg, border: `1px solid ${border}` }}>
                    {label}
                  </span>
                </div>
              );
            })
          )}

          <button style={d.viewAllBtn} onClick={() => router.push(`/${currentLocale}/sparring`)}>
            СПАРРИНГ ХУУДАС →
          </button>
        </div>
      )}
    </aside>
  );
}
