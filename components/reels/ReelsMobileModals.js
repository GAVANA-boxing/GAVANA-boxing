"use client";

import dynamic from "next/dynamic";
import ReportModal from "@/components/ReportModal";

const CommentsModal = dynamic(() => import("@/components/reels/CommentsModal"), { ssr: false });
const FeedbackModal = dynamic(() => import("@/components/reels/FeedbackModal"), { ssr: false });
const CaptionSheet = dynamic(() => import("@/components/reels/CaptionSheet"), { ssr: false });
const FilterSheet = dynamic(() => import("@/components/reels/FilterSheet"), { ssr: false });

/**
 * ReelsMobileModals
 *
 * Groups all the overlay modals / sheets used by the mobile reels feed.
 * All state lives in ReelsContent — this component is purely structural.
 */
export default function ReelsMobileModals({
  // Comments
  showComments,
  comments,
  commentProfiles,
  newComment,
  setNewComment,
  replyingTo,
  setReplyingTo,
  expandedReplies,
  setExpandedReplies,
  onCloseComments,
  onAddComment,
  onDeleteComment,
  // Feedback
  feedbackOpen,
  feedbackLoading,
  feedbackError,
  feedbackResult,
  feedbackSaved,
  sessionXPData,
  feedbackReel,
  onCloseFeedback,
  // Caption sheet
  captionSheetReelId,
  reels,
  setCaptionSheetReelId,
  // Filter sheet
  showFilterSheet,
  diffFilter,
  ctFilter,
  setDiffFilter,
  setCtFilter,
  setShowFilterSheet,
  // Report modal
  reportReel,
  onCloseReport,
  // Shared
  user,
  router,
  currentLocale,
  t,
}) {
  return (
    <>
      <CommentsModal
        showComments={showComments}
        comments={comments}
        commentProfiles={commentProfiles}
        newComment={newComment}
        setNewComment={setNewComment}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        expandedReplies={expandedReplies}
        setExpandedReplies={setExpandedReplies}
        user={user}
        currentLocale={currentLocale}
        t={t}
        router={router}
        onClose={onCloseComments}
        onAddComment={onAddComment}
        onDeleteComment={onDeleteComment}
      />

      <FeedbackModal
        feedbackOpen={feedbackOpen}
        feedbackLoading={feedbackLoading}
        feedbackError={feedbackError}
        feedbackResult={feedbackResult}
        feedbackSaved={feedbackSaved}
        sessionXPData={sessionXPData}
        feedbackReel={feedbackReel}
        t={t}
        onClose={onCloseFeedback}
      />

      <CaptionSheet
        captionSheetReelId={captionSheetReelId}
        reels={reels}
        setCaptionSheetReelId={setCaptionSheetReelId}
        t={t}
        currentLocale={currentLocale}
      />

      <FilterSheet
        showFilterSheet={showFilterSheet}
        diffFilter={diffFilter}
        ctFilter={ctFilter}
        setDiffFilter={setDiffFilter}
        setCtFilter={setCtFilter}
        setShowFilterSheet={setShowFilterSheet}
        currentLocale={currentLocale}
        t={t}
      />

      {reportReel && (
        <ReportModal
          targetId={reportReel.id}
          targetType="reel"
          onClose={onCloseReport}
          t={t}
        />
      )}
    </>
  );
}
