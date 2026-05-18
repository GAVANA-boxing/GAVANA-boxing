"use client";

import styles from "./reelStyles";

export default function CommentsModal({
  showComments,
  comments,
  commentProfiles,
  newComment,
  setNewComment,
  replyingTo,
  setReplyingTo,
  expandedReplies,
  setExpandedReplies,
  user,
  currentLocale,
  t,
  router,
  onClose,
  onAddComment,
  onDeleteComment,
}) {
  if (!showComments) return null;

  const topLevel = comments.filter((c) => !c.parentId);
  const repliesByParent = comments.reduce((acc, c) => {
    if (c.parentId) { acc[c.parentId] = acc[c.parentId] || []; acc[c.parentId].push(c); }
    return acc;
  }, {});

  const renderComment = (comment, isReply = false) => {
    const profile = comment.userId ? commentProfiles[comment.userId] : null;
    const name = profile?.displayName || comment.username || "user";
    const photo = comment.userPhotoURL || profile?.photoURL || "";
    return (
      <div key={comment.id} style={isReply ? styles.replyItem : styles.commentItem}>
        <button type="button" style={isReply ? styles.replyAvatar : styles.commentAvatar}
          onClick={() => comment.userId && router.push(`/${currentLocale}/profile/${comment.userId}`)}>
          {photo ? <img src={photo} alt="" style={styles.commentAvatarImage} /> : name.charAt(0).toUpperCase()}
        </button>
        <div style={styles.commentContent}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button type="button" style={styles.commentUsername}
              onClick={() => comment.userId && router.push(`/${currentLocale}/profile/${comment.userId}`)}>
              @{name}
            </button>
            {user?.uid === comment.userId && (
              <button
                type="button"
                onClick={() => onDeleteComment(comment)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", color: "rgba(255,255,255,0.25)", lineHeight: 1 }}
                title={currentLocale === "mn" ? "Устгах" : currentLocale === "ko" ? "삭제" : "Delete"}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
              </button>
            )}
          </div>
          <div style={styles.commentText}>{comment.text}</div>
          {!isReply && user && (
            <button type="button" style={styles.replyBtn}
              onClick={() => setReplyingTo(replyingTo?.commentId === comment.id ? null : { commentId: comment.id, username: name })}>
              {replyingTo?.commentId === comment.id ? t("cancelReply") : t("reply")}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.commentsModal}>
      <div style={styles.commentsOverlay} onClick={onClose} />
      <div style={styles.commentsContent}>
        <div style={styles.commentsHandle} />
        <div style={styles.commentsHeader}>
          <span style={styles.commentsTitle}>
            {t("comment")}{comments.length > 0 ? ` (${comments.length})` : ""}
          </span>
          <button style={styles.commentsClose} onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div style={styles.commentsList}>
          {comments.length === 0 ? (
            <div style={styles.noComments}>{t("noCommentsYet")}</div>
          ) : (
            topLevel.map((comment) => {
              const replies = repliesByParent[comment.id] || [];
              const isExpanded = expandedReplies.has(comment.id);
              return (
                <div key={comment.id}>
                  {renderComment(comment, false)}
                  {replies.length > 0 && (
                    <div style={styles.repliesSection}>
                      <button type="button" style={styles.toggleReplies}
                        onClick={() => setExpandedReplies((prev) => {
                          const next = new Set(prev);
                          isExpanded ? next.delete(comment.id) : next.add(comment.id);
                          return next;
                        })}>
                        {isExpanded ? `▲ ${t("hideReplies")}` : `▼ ${t("viewReplies").replace("{n}", replies.length)}`}
                      </button>
                      {isExpanded && replies.map((r) => renderComment(r, true))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {user && (
          <div style={styles.commentInput}>
            <div style={{ display: "flex", gap: 6, padding: "6px 12px 0", overflowX: "auto", scrollbarWidth: "none" }}>
              {["🥊", "🔥", "💪", "👏", "🙌", "👊"].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setNewComment((prev) => prev + emoji)}
                  style={{ flexShrink: 0, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "4px 8px", fontSize: 16, cursor: "pointer", lineHeight: 1 }}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {replyingTo && (
              <div style={styles.replyPill}>
                <span style={styles.replyPillText}>↩ @{replyingTo.username}</span>
                <button type="button" style={styles.replyPillClose} onClick={() => setReplyingTo(null)}>✕</button>
              </div>
            )}
            <div style={styles.commentInputRow}>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyingTo ? `${t("replyTo")} @${replyingTo.username}…` : t("addComment")}
                style={styles.commentInputField}
                onKeyDown={(e) => e.key === "Enter" && onAddComment()}
              />
              <button
                onClick={onAddComment}
                disabled={!newComment.trim()}
                style={{ ...styles.commentSendBtn, ...(newComment.trim() ? {} : styles.commentSendBtnDisabled) }}
              >
                {t("send")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
