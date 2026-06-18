"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RED, whiteAlpha, blackAlpha, RADIUS } from "@/lib/tokens";
import { getFighterRank } from "@/lib/xp";

export default function FollowListModal({ type, userId, locale, onClose }) {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const label = type === "followers" ? "Corners" : "In Camp";

  const fetchUsers = useCallback(async () => {
    try {
      const [{ db }, { collection, query, where, getDocs, doc, getDoc }] =
        await Promise.all([
          import("@/lib/firebase"),
          import("firebase/firestore"),
        ]);

      const field = type === "followers" ? "followingId" : "followerId";
      const otherField = type === "followers" ? "followerId" : "followingId";

      const q = query(collection(db, "follows"), where(field, "==", userId));
      const snap = await getDocs(q);

      const userIds = snap.docs.map((d) => d.data()[otherField]);

      if (userIds.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      const userDocs = await Promise.all(
        userIds.map((uid) => getDoc(doc(db, "users", uid)))
      );

      const result = userDocs
        .filter((d) => d.exists())
        .map((d) => ({ id: d.id, ...d.data() }));

      setUsers(result);
    } catch (e) {
      console.error("FollowListModal fetch error:", e);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [type, userId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUserTap = (uid) => {
    onClose();
    router.push(`/${locale}/profile/${uid}`);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9600,
        background: blackAlpha(0.88),
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(440px, 100vw)",
          background: "rgba(14,14,16,0.98)",
          borderRadius: "20px 20px 0 0",
          paddingBottom: `calc(max(env(safe-area-inset-bottom), 20px) + 16px)`,
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          animation: "slideUp 280ms cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Handle bar */}
        <div
          style={{
            width: 32,
            height: 3,
            background: "rgba(255,255,255,0.14)",
            borderRadius: RADIUS.full,
            margin: "12px auto",
          }}
        />

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px 14px",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              color: "#fff",
              fontSize: 15,
              fontWeight: 900,
              letterSpacing: "-0.01em",
            }}
          >
            {label}
          </span>
          <button
            onClick={onClose}
            style={{
              background: whiteAlpha(0.08),
              border: "none",
              borderRadius: RADIUS.full,
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: whiteAlpha(0.6),
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: whiteAlpha(0.06),
            flexShrink: 0,
          }}
        />

        {/* Content */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 48,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: `3px solid ${whiteAlpha(0.12)}`,
                  borderTopColor: RED,
                  animation: "spin 0.7s linear infinite",
                }}
              />
            </div>
          ) : users.length === 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px 20px",
                color: whiteAlpha(0.35),
                fontSize: 13,
                textAlign: "center",
              }}
            >
              No {label.toLowerCase()} yet
            </div>
          ) : (
            <div style={{ padding: "8px 0" }}>
              {users.map((u) => {
                const rank = getFighterRank(u.xp || 0);
                const initial = (u.displayName || u.username || "?")[0].toUpperCase();
                return (
                  <button
                    key={u.id}
                    onClick={() => handleUserTap(u.id)}
                    style={{
                      width: "100%",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 20px",
                      textAlign: "left",
                      transition: "background 160ms ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = whiteAlpha(0.04))
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "none")
                    }
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        overflow: "hidden",
                        flexShrink: 0,
                        background: whiteAlpha(0.1),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        color: whiteAlpha(0.7),
                      }}
                    >
                      {u.photoURL ? (
                        <img
                          src={u.photoURL}
                          alt={u.displayName}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        initial
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {u.displayName || u.username || "Fighter"}
                      </div>
                      {u.username && (
                        <div
                          style={{
                            color: whiteAlpha(0.35),
                            fontSize: 10,
                            marginTop: 1,
                          }}
                        >
                          @{u.username}
                        </div>
                      )}
                    </div>

                    {/* Rank badge */}
                    {rank && (
                      <div
                        style={{
                          background: rank.gradient || rank.color,
                          borderRadius: RADIUS.full,
                          padding: "2px 8px",
                          fontSize: 9,
                          fontWeight: 800,
                          color: "#fff",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                        }}
                      >
                        {rank.key
                          .replace("rank", "")
                          .replace(/([A-Z])/g, " $1")
                          .trim()}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
