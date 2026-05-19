"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, Timestamp, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createFeaturedNotification } from "@/lib/notifications";

export function useAdminFeaturedCreators({ user, authLoading }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [featuredList, setFeaturedList] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  // Search / feature form state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reason, setReason] = useState("");
  const [daysUntil, setDaysUntil] = useState(7);
  const [submitting, setSubmitting] = useState(false);
  const [removing, setRemoving] = useState(null);

  // Check admin status
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setAdminChecked(true);
      return;
    }
    async function check() {
      try {
        const snap = await getDocs(query(collection(db, "users"), where("__name__", "==", user.uid)));
        const data = snap.docs[0]?.data() || {};
        setIsAdmin(!!data.isAdmin || !!data.admin);
      } catch { /* silent */ }
      setAdminChecked(true);
    }
    check();
  }, [user, authLoading]);

  // Load current featured creators
  useEffect(() => {
    if (!adminChecked || !isAdmin) return;
    loadFeatured();
  }, [adminChecked, isAdmin]);

  async function loadFeatured() {
    setLoadingFeatured(true);
    try {
      const now = Timestamp.now();
      const snap = await getDocs(query(collection(db, "featured_creators"), where("featuredUntil", ">=", now)));
      const items = [];
      for (const d of snap.docs) {
        const data = d.data();
        // Load user profile
        const userSnap = await getDocs(query(collection(db, "users"), where("__name__", "==", data.userId)));
        const profile = userSnap.docs[0]?.data() || {};
        items.push({
          docId: d.id,
          ...data,
          displayName: profile.displayName || profile.username || data.userId,
          photoURL: profile.photoURL || profile.profileImageUrl || "",
        });
      }
      setFeaturedList(items);
    } catch { /* silent */ }
    setLoadingFeatured(false);
  }

  async function handleSearch(e) {
    e.preventDefault();
    const term = searchTerm.trim().toLowerCase();
    if (!term) return;
    try {
      const snap = await getDocs(collection(db, "users"));
      const results = [];
      snap.forEach((d) => {
        const data = d.data();
        const name = String(data.displayName || "").toLowerCase();
        const uname = String(data.username || "").toLowerCase();
        if (name.includes(term) || uname.includes(term)) {
          results.push({ id: d.id, ...data });
        }
      });
      setSearchResults(results.slice(0, 12));
    } catch { /* silent */ }
  }

  async function handleFeature() {
    if (!selectedUser || submitting) return;
    setSubmitting(true);
    try {
      const featuredUntil = Timestamp.fromDate(
        new Date(Date.now() + Number(daysUntil) * 24 * 60 * 60 * 1000)
      );
      await addDoc(collection(db, "featured_creators"), {
        userId: selectedUser.id,
        reason: reason.trim() || "",
        featuredUntil,
        createdAt: serverTimestamp(),
      });
      createFeaturedNotification({ creatorId: selectedUser.id }).catch(() => {});
      setSelectedUser(null);
      setReason("");
      setDaysUntil(7);
      setSearchResults([]);
      setSearchTerm("");
      await loadFeatured();
    } catch { /* silent */ }
    setSubmitting(false);
  }

  async function handleRemove(docId) {
    if (removing) return;
    setRemoving(docId);
    try {
      await deleteDoc(doc(db, "featured_creators", docId));
      setFeaturedList((prev) => prev.filter((f) => f.docId !== docId));
    } catch { /* silent */ }
    setRemoving(null);
  }

  return {
    isAdmin, adminChecked,
    featuredList, loadingFeatured,
    searchTerm, setSearchTerm,
    searchResults,
    selectedUser, setSelectedUser,
    reason, setReason,
    daysUntil, setDaysUntil,
    submitting, removing,
    handleSearch, handleFeature, handleRemove,
  };
}
