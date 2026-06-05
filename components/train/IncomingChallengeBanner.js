"use client";

import { useEffect, useState } from "react";
import { getFirebase } from "@/lib/lazyFirebase";
import { PURPLE } from "@/lib/tokens";

const LABELS = {
  en: { challenged: "challenged you", respond: "Respond ⚔️", dismiss: "Later" },
  mn: { challenged: "танд тулаан дуудлаа", respond: "Хариул ⚔️", dismiss: "Дараа" },
  ko: { challenged: "도전장을 보냈습니다", respond: "응전 ⚔️",    dismiss: "나중에" },
};

export default function IncomingChallengeBanner({ user, locale, router }) {
  const [battle, setBattle]       = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [challenger, setChallenger] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    (async () => {
      try {
        const { db } = await getFirebase();
        const { collection, query, where, orderBy, getDocs, limit } = await import("firebase/firestore");
        const snap = await getDocs(
          query(
            collection(db, "pvp_challenges"),
            where("opponentId", "==", user.uid),
            where("status", "==", "pending"),
            orderBy("createdAt", "desc"),
            limit(1),
          )
        );
        if (!active || snap.empty) return;
        const doc = snap.docs[0];
        const data = { id: doc.id, ...doc.data() };
        setBattle(data);

        // Load challenger name
        const { getDoc, doc: fsDoc } = await import("firebase/firestore");
        const cSnap = await getDoc(fsDoc(db, "users", data.challengerId));
        if (active && cSnap.exists()) {
          setChallenger(cSnap.data()?.displayName || cSnap.data()?.username || "Fighter");
        }
      } catch { /* non-critical */ }
    })();
    return () => { active = false; };
  }, [user?.uid]);

  if (!battle || dismissed) return null;

  const L = LABELS[locale] || LABELS.en;
  const challengeId = battle.challengeId || "jab-minute";

  return (
    <div style={{
      margin: "0 0 14px",
      padding: "12px 14px",
      borderRadius: 14,
      background: `${PURPLE}12`,
      border: `1px solid ${PURPLE}40`,
      display: "flex",
      alignItems: "center",
      gap: 10,
    }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>⚔️</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {challenger || "Fighter"}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 1 }}>
          {L.challenged}
        </div>
      </div>
      <button
        type="button"
        onClick={() => router.push(`/${locale}/train?challengeId=${challengeId}&challengeUserId=${battle.challengerId}`)}
        style={{
          padding: "8px 14px",
          borderRadius: 10,
          border: "none",
          background: `linear-gradient(135deg, ${PURPLE}, #4C1D95)`,
          color: "#fff",
          fontSize: 12,
          fontWeight: 900,
          cursor: "pointer",
          flexShrink: 0,
          boxShadow: `0 4px 14px ${PURPLE}35`,
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {L.respond}
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        style={{
          padding: "8px 10px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "transparent",
          color: "rgba(255,255,255,0.35)",
          fontSize: 11,
          fontWeight: 700,
          cursor: "pointer",
          flexShrink: 0,
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {L.dismiss}
      </button>
    </div>
  );
}
