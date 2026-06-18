"use client";

import Image from "next/image";
import { RED, RADIUS, redAlpha } from "@/lib/tokens";
import { formatAgo } from "@/lib/utils";
import s, { c } from "@/components/sparring/sparringStyles";
import { IncomingRequestCard } from "@/components/sparring/SparringCards";

/**
 * Props:
 *   user               – Firebase user
 *   locale             – locale string
 *   t                  – translate(locale, key) shorthand
 *   requestsSubTab     – "received" | "sent"
 *   setRequestsSubTab  – setter
 *   pendingIncoming    – requests with status === "pending"
 *   resolvedIncoming   – requests with status !== "pending"
 *   sentRequests       – outgoing sparring requests array
 *   handleAccept       – fn(req)
 *   handleDecline      – fn(req)
 *   accepting          – reqId currently being accepted
 *   declining          – reqId currently being declined
 *   cancelling         – reqId currently being cancelled
 *   handleCancelSparringRequest – fn(req)
 */
export default function RequestsTab({
  user,
  locale,
  t,
  requestsSubTab,
  setRequestsSubTab,
  pendingIncoming,
  resolvedIncoming,
  sentRequests,
  handleAccept,
  handleDecline,
  accepting,
  declining,
  cancelling,
  handleCancelSparringRequest,
}) {
  return (
    <div style={s.list}>
      {/* Sent / Received sub-tabs */}
      <div style={{ display: "flex", gap: 0, margin: "10px 16px 4px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
        {[
          { key: "received", label: t("sparringTabReceived"), count: pendingIncoming.length },
          { key: "sent",     label: t("sparringTabSent"), count: sentRequests.filter((r) => r.status === "pending").length },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            onClick={() => setRequestsSubTab(key)}
            style={{
              flex: 1, padding: "10px 8px", border: "none",
              background: requestsSubTab === key ? `${redAlpha(0.2)}` : "transparent",
              color: requestsSubTab === key ? "#fff" : "rgba(255,255,255,0.4)",
              fontSize: 12, fontWeight: 800, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            {label}
            {count > 0 && (
              <span style={{ minWidth: 16, height: 16, borderRadius: RADIUS.full, background: RED, color: "#fff", fontSize: 9, fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {!user ? (
        <div style={s.empty}>
          <p style={s.emptyTitle}>{t("sparringLoginRequired")}</p>
        </div>
      ) : requestsSubTab === "received" ? (
        pendingIncoming.length === 0 && resolvedIncoming.length === 0 ? (
          <div style={s.empty}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 4 }}>📬</div>
            <p style={s.emptyTitle}>{t("sparringReceivedEmpty")}</p>
            <p style={s.emptySub}>{t("sparringActivateHint")}</p>
          </div>
        ) : (
          <>
            {pendingIncoming.length > 0 && (
              <>
                <div style={s.sectionLabel}>
                  {t("sparringPendingRequests")}
                </div>
                {pendingIncoming.map((req) => (
                  <div key={req.id} style={{ padding: "0 16px 8px" }}>
                    <IncomingRequestCard
                      req={req}
                      onAccept={handleAccept}
                      onDecline={handleDecline}
                      accepting={accepting}
                      declining={declining}
                      locale={locale}
                    />
                  </div>
                ))}
              </>
            )}
            {resolvedIncoming.length > 0 && (
              <>
                <div style={s.sectionLabel}>
                  {t("sparringResolvedRequests")}
                </div>
                {resolvedIncoming.map((req) => {
                  const isAccepted = req.status === "accepted";
                  const col = isAccepted ? "#34D399" : "#F87171";
                  const ago = formatAgo(req.createdAt, locale);
                  return (
                    <div key={req.id} style={{ padding: "0 16px 8px" }}>
                      <div style={{ ...c.card, borderLeft: `2.5px solid ${col}`, opacity: 0.65 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {req.fromPhotoURL
                              ? <Image src={req.fromPhotoURL} alt="" width={36} height={36} style={{ ...c.avatar, width: 36, height: 36 }} />
                              : <div style={{ ...c.avatarFallback, width: 36, height: 36, fontSize: 14 }}>{(req.fromDisplayName || "?").charAt(0).toUpperCase()}</div>
                            }
                            <div>
                              <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{req.fromDisplayName || "Fighter"}</span>
                              {ago && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", marginTop: 2 }}>🕐 {ago}</div>}
                            </div>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 900, color: col }}>
                            {isAccepted ? t("sparringStatusAccepted") : t("sparringStatusDeclined")}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </>
        )
      ) : (
        // Sent requests sub-tab
        sentRequests.length === 0 ? (
          <div style={s.empty}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 4 }}>📤</div>
            <p style={s.emptyTitle}>{t("sparringSentEmpty")}</p>
            <p style={s.emptySub}>{t("sparringDiscoverHint")}</p>
          </div>
        ) : (
          <>
            {sentRequests.map((req) => {
              const isPending = req.status === "pending";
              const isAccepted = req.status === "accepted";
              const col = isAccepted ? "#34D399" : isPending ? "#F59E0B" : "#F87171";
              const ago = formatAgo(req.createdAt, locale);
              const isBusy = cancelling === req.id;
              return (
                <div key={req.id} style={{ padding: "0 16px 8px" }}>
                  <div style={{ ...c.card, borderLeft: `2.5px solid ${col}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 2 }}>
                          {t("sparringSentRequest")}
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: col }}>
                            {isAccepted ? t("sparringStatusAccepted") : isPending ? t("sparringStatusPending") : t("sparringStatusDeclined")}
                          </span>
                          {ago && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.38)" }}>· {ago}</span>}
                        </div>
                      </div>
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => !isBusy && handleCancelSparringRequest(req)}
                          disabled={isBusy}
                          style={{
                            flexShrink: 0, padding: "7px 12px", borderRadius: 8,
                            border: "1px solid rgba(248,113,113,0.3)",
                            background: "rgba(248,113,113,0.07)",
                            color: "#F87171", fontSize: 11, fontWeight: 900,
                            cursor: isBusy ? "wait" : "pointer", opacity: isBusy ? 0.6 : 1,
                          }}
                        >
                          {isBusy ? "…" : t("sparringCancelBtn")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )
      )}
      <div style={{ height: "calc(24px + env(safe-area-inset-bottom))" }} />
    </div>
  );
}
