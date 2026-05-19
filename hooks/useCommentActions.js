"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createNotification } from "@/lib/notifications";
import { getFirebase } from "@/lib/lazyFirebase";

export function useCommentActions({ user, router, currentLocale, reels }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentProfiles, setCommentProfiles] = useState({});
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const [selectedReelId, setSelectedReelId] = useState(null);
  const commentsUnsubscribeRef = useRef(null);
  const commentProfileRequests = useRef(new Set());

  const handleOpenComments = useCallback(async (reelId) => {
    const targetReel = reels.find((reel) => reel.id === reelId);
    if (targetReel?.isDemo) {
      setSelectedReelId(reelId);
      setShowComments(true);
      setNewComment("");
      setComments([
        {
          id: "demo-comment",
          username: "coach",
          userId: null,
          text: "Hook them early: start with the punch, then show the lesson.",
        },
      ]);
      return;
    }

    if (!user?.uid) {
      router.push(`/${currentLocale}/login`);
      return;
    }

    setSelectedReelId(reelId);
    setShowComments(true);
    setComments([]);
    setNewComment("");

    try {
      if (commentsUnsubscribeRef.current) {
        commentsUnsubscribeRef.current();
        commentsUnsubscribeRef.current = null;
      }

      const { db } = await getFirebase();
      const { collection, query, orderBy, onSnapshot } = await import("firebase/firestore");

      const commentsQuery = query(
        collection(db, "reels", reelId, "comments"),
        orderBy("createdAt", "desc")
      );

      commentsUnsubscribeRef.current = onSnapshot(commentsQuery, (snapshot) => {
        const commentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setComments(commentsData);
      }, (err) => {
        console.error("Failed to listen for comments:", err);
        setComments([]);
      });
    } catch (err) {
      console.error("Failed to load comments:", err);
    }
  }, [user?.uid, router, currentLocale, reels]);

  const handleAddComment = useCallback(async () => {
    if (!user || !newComment.trim() || !selectedReelId) return;
    const selectedReel = reels.find((reel) => reel.id === selectedReelId);
    if (selectedReel?.isDemo) return;

    try {
      const { db } = await getFirebase();
      const { collection, addDoc, serverTimestamp, increment, doc, updateDoc } = await import("firebase/firestore");

      await addDoc(collection(db, "reels", selectedReelId, "comments"), {
        userId: user.uid,
        username: user.displayName || user.email.split("@")[0],
        userPhotoURL: user.photoURL || "",
        text: newComment.trim(),
        createdAt: serverTimestamp(),
        parentId: replyingTo?.commentId || null,
      });

      const reelRef = doc(db, "reels", selectedReelId);
      await updateDoc(reelRef, { commentsCount: increment(1) });
      await createNotification({
        recipientId: selectedReel?.userId,
        actorId: user.uid,
        actorName: user.email?.split("@")[0],
        type: "comment",
        reelId: selectedReelId,
        text: newComment.trim(),
      });

      setNewComment("");
      setReplyingTo(null);
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  }, [user, newComment, selectedReelId, reels, replyingTo]);

  const handleDeleteComment = useCallback(async (comment) => {
    if (!user || comment.userId !== user.uid || !selectedReelId) return;
    try {
      const { db } = await getFirebase();
      const { doc, deleteDoc, updateDoc, increment } = await import("firebase/firestore");
      await deleteDoc(doc(db, "reels", selectedReelId, "comments", comment.id));
      await updateDoc(doc(db, "reels", selectedReelId), { commentsCount: increment(-1) });
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  }, [user, selectedReelId]);

  const handleCloseComments = useCallback(() => {
    if (commentsUnsubscribeRef.current) {
      commentsUnsubscribeRef.current();
      commentsUnsubscribeRef.current = null;
    }
    setShowComments(false);
    setSelectedReelId(null);
    setComments([]);
    setNewComment("");
    setReplyingTo(null);
    setExpandedReplies(new Set());
  }, []);

  useEffect(() => {
    return () => {
      if (commentsUnsubscribeRef.current) {
        commentsUnsubscribeRef.current();
        commentsUnsubscribeRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!comments.length) return;

    let isActive = true;
    const missingUserIds = [...new Set(comments
      .map((comment) => comment.userId)
      .filter((commentUserId) => commentUserId && !commentProfiles[commentUserId] && !commentProfileRequests.current.has(commentUserId))
    )];

    if (!missingUserIds.length) return;

    async function loadCommentProfiles() {
      try {
        const { db } = await getFirebase();
        const { doc, getDoc } = await import("firebase/firestore");

        await Promise.all(missingUserIds.map(async (commentUserId) => {
          commentProfileRequests.current.add(commentUserId);
          const userSnap = await getDoc(doc(db, "users", commentUserId));
          const userData = userSnap.exists() ? userSnap.data() : {};

          if (!isActive) return;

          setCommentProfiles((prev) => ({
            ...prev,
            [commentUserId]: {
              displayName: userData.displayName || userData.username || "",
              photoURL: userData.photoURL || userData.profileImageUrl || userData.profileImage || userData.avatarUrl || "",
            },
          }));
        }));
      } catch (error) {
        console.error("Failed to load comment profiles:", error);
      }
    }

    loadCommentProfiles();
    return () => { isActive = false; };
  }, [comments, commentProfiles]);

  return {
    showComments, setShowComments,
    comments, setComments,
    commentProfiles,
    newComment, setNewComment,
    replyingTo, setReplyingTo,
    expandedReplies, setExpandedReplies,
    selectedReelId,
    handleOpenComments,
    handleAddComment,
    handleDeleteComment,
    handleCloseComments,
  };
}
