"use client";
import { useState } from "react";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useDiscoverSearch() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [userResults, setUserResults] = useState([]);
  const [reelResults, setReelResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    const term = query.trim().toLowerCase();
    if (!term) return;
    setSearching(true);
    setHasSearched(true);
    setSearchError(false);
    try {
      const [usersSnap, reelsSnap] = await Promise.all([
        getDocs(query(collection(db, "users"), limit(400))),
        getDocs(query(collection(db, "reels"), limit(400))),
      ]);
      const users = [];
      usersSnap.forEach((doc) => {
        const d = doc.data();
        if (
          String(d.username || "").toLowerCase().includes(term) ||
          String(d.displayName || "").toLowerCase().includes(term)
        ) users.push({ id: doc.id, ...d });
      });
      const reels = [];
      reelsSnap.forEach((doc) => {
        const d = doc.data();
        if (String(d.caption || d.description || "").toLowerCase().includes(term))
          reels.push({ id: doc.id, ...d });
      });
      setUserResults(users.slice(0, 20));
      setReelResults(reels.slice(0, 20));
    } catch {
      setSearchError(true);
    }
    setSearching(false);
  };

  const clearSearch = () => {
    setQuery("");
    setUserResults([]);
    setReelResults([]);
    setHasSearched(false);
  };

  return {
    query, setQuery,
    searching,
    searchError,
    userResults,
    reelResults,
    hasSearched,
    handleSearch,
    clearSearch,
  };
}
