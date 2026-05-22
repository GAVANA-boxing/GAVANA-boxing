"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { translate } from "@/lib/i18n";
import Image from "next/image";

export default function Leaderboard({ locale = "en" }) {
  const t = (key) => translate(locale, key);
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const leaderboardRef = collection(db, "leaderboard");
        const snapshot = await getDocs(leaderboardRef);
        const entries = snapshot.docs.map(doc => ({
          userId: doc.id,
          ...doc.data()
        }));

        // Sort by bestScore descending
        entries.sort((a, b) => b.bestScore - a.bestScore);

        setLeaderboard(entries.slice(0, 10)); // Top 10

        // Find current user rank
        if (user?.uid) {
          const userIndex = entries.findIndex(entry => entry.userId === user.uid);
          setCurrentUserRank(userIndex >= 0 ? userIndex + 1 : null);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [user?.uid]);

  if (loading) {
    return <div className="p-4 text-center">{t("leaderboardLoading")}</div>;
  }

  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg">
      <h2 className="text-xl font-bold mb-4">{t("leaderboardTitle")}</h2>
      {currentUserRank && (
        <p className="mb-4">{t("leaderboardYourRank").replace("{rank}", currentUserRank)}</p>
      )}
      <ul className="space-y-2">
        {leaderboard.map((entry, index) => (
          <li
            key={entry.userId}
            className={`flex items-center p-2 rounded ${
              entry.userId === user?.uid ? "bg-blue-600" : "bg-gray-800"
            }`}
          >
            <span className="w-8 text-center font-bold">#{index + 1}</span>
            <Image
              src={entry.photoURL || "/default-avatar.png"}
              alt={entry.username}
              width={32}
              height={32}
              className="rounded-full ml-2"
            />
            <span className="ml-2 flex-1">{entry.username}</span>
            <span className="font-bold">{entry.bestScore}/10</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Function to update leaderboard on new feedback
export async function updateLeaderboard(userId, score, username, photoURL) {
  try {
    const leaderboardRef = doc(db, "leaderboard", userId);
    const docSnap = await getDoc(leaderboardRef);
    const currentBest = docSnap.exists() ? docSnap.data().bestScore : 0;

    if (score > currentBest) {
      await setDoc(leaderboardRef, {
        bestScore: score,
        username,
        photoURL
      });
    }
  } catch (error) {
  }
}
