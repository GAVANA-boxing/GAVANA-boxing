"use client";

import { useEffect, useRef, useState } from "react";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createPvpNotification } from "@/lib/notifications";
import { getCurrentSeasonId } from "@/lib/season";

export function usePvpResult({ result, challengeUserId, targetScore, user, reelId, opponentUsername, locale, pvpSavedRef: externalPvpSavedRef }) {
  const [pvpResult, setPvpResult] = useState(null);
  const [pvpSaved, setPvpSaved] = useState(false);
  const internalPvpSavedRef = useRef(false);
  const pvpSavedRef = externalPvpSavedRef ?? internalPvpSavedRef;

  useEffect(() => {
    if (!result || !challengeUserId || !targetScore || !user?.uid || pvpSavedRef.current) return;

    pvpSavedRef.current = true;
    const won = result.score > targetScore;
    const pvpRes = won ? "win" : "lose";
    setPvpResult(pvpRes);

    async function savePvpAndNotify() {
      try {
        const challengerSnap = await getDoc(doc(db, "users", user.uid));
        const challengerData = challengerSnap.exists() ? challengerSnap.data() : {};
        const challengerName = challengerData.username || challengerData.displayName || user.displayName || "Fighter";
        const opponentName = opponentUsername || "Opponent";

        await addDoc(collection(db, "pvp_results"), {
          challengerId: user.uid,
          challengerName,
          opponentId: challengeUserId,
          opponentName,
          reelId: reelId || null,
          challengerScore: result.score,
          opponentScore: targetScore,
          result: pvpRes,
          seasonId: getCurrentSeasonId(),
          createdAt: serverTimestamp(),
          locale,
        });
        setPvpSaved(true);

        createPvpNotification({
          opponentId: challengeUserId,
          challengerId: user.uid,
          challengerName,
          reelId: reelId || null,
          challengerScore: result.score,
          opponentScore: targetScore,
          result: pvpRes,
        }).catch(console.error);
      } catch (err) {
        console.error("Failed to save PvP result:", err);
      }
    }

    savePvpAndNotify();
  }, [result, challengeUserId, targetScore, user?.uid, user?.displayName, reelId, opponentUsername, locale, pvpSavedRef]);

  return { pvpResult, pvpSaved, setPvpResult, setPvpSaved, pvpSavedRef };
}
