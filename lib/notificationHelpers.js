import { getTimestampMs } from "@/lib/utils";

export function getActorName(notification) {
  return notification.fromUsername || notification.actorName || "Someone";
}

export function getActorId(notification) {
  return notification.fromUserId || notification.actorId;
}

export function getActorPhoto(notification, actorProfile) {
  return (
    notification.fromUserPhotoURL ||
    notification.actorPhotoURL ||
    actorProfile?.photoURL ||
    actorProfile?.profileImageUrl ||
    actorProfile?.profileImage ||
    actorProfile?.avatarUrl ||
    ""
  );
}

export function getTypeLabel(type, t) {
  if (type === "like") return t("like");
  if (type === "comment") return t("comment");
  if (type === "follow") return t("follow");
  if (type === "save") return t("save");
  if (type === "pvp_challenge") return t("pvpNotifType");
  if (type === "challenge_attempt") return t("notifTypeChallengeAttempt");
  if (type === "remix") return t("notifTypeRemix");
  if (type === "featured") return t("notifTypeFeatured");
  if (type === "new_follower") return t("newFollower");
  if (type === "challenge_beaten") return t("challengeBeaten");
  if (type === "coach_request") return t("notifLabelCoachRequest");
  if (type === "gym_join_request") return t("notifLabelGymJoinRequest");
  if (type === "coach_accept") return t("notifLabelCoachAccept");
  if (type === "coach_decline") return t("notifLabelCoachDecline");
  if (type === "gym_approved") return t("notifLabelGymApproved");
  if (type === "gym_declined") return t("notifLabelGymDeclined");
  if (type === "booking_scheduled") return t("notifLabelBookingScheduled");
  if (type === "session_completed") return t("notifLabelSessionCompleted");
  if (type === "mention") return t("notifTypeMention");
  if (type === "sparring_request") return t("notifLabelSparringRequest");
  if (type === "sparring_accepted") return t("notifLabelSparringAccepted");
  if (type === "event_rsvp") return t("notifTypeEventRsvp");
  return t("update");
}

export function getTranslatedNotificationText(notification, t) {
  const actor = getActorName(notification);

  if (notification.type === "pvp_challenge") {
    const key = notification.result === "win" ? "pvpNotifBeat" : "pvpNotifFailed";
    return t(key).replace("{actor}", actor);
  }
  if (notification.type === "challenge_attempt") return t("notifChallengeAttempt").replace("{actor}", actor);
  if (notification.type === "remix") return t("notifRemix").replace("{actor}", actor);
  if (notification.type === "featured") return t("notifFeatured");
  if (notification.type === "new_follower") return t("newFollowerLabel").replace("{actor}", actor);
  if (notification.type === "challenge_beaten") return t("challengeBeatenLabel").replace("{actor}", actor);
  if (notification.type === "coach_request") return t("notifCoachRequest").replace("{actor}", actor);
  if (notification.type === "gym_join_request") return t("notifGymJoinRequest").replace("{actor}", actor);
  if (notification.type === "coach_accept") return t("notifCoachAccepted");
  if (notification.type === "coach_decline") return t("notifCoachDeclined");
  if (notification.type === "gym_approved") return t("notifGymApproved");
  if (notification.type === "gym_declined") return t("notifGymDeclined");
  if (notification.type === "booking_scheduled") return t("sessionScheduled");
  if (notification.type === "session_completed") return t("coachSessionCompleted");
  if (notification.type === "sparring_request") return notification.message || t("notificationDefault").replace("{actor}", actor);
  if (notification.type === "sparring_accepted") return notification.message || t("notificationDefault").replace("{actor}", actor);
  if (notification.type === "event_rsvp") return notification.message || t("notificationDefault").replace("{actor}", actor);
  if (notification.type === "event_reminder") return notification.message || t("notificationDefault").replace("{actor}", actor);

  const keyByType = {
    like: "notificationLike",
    comment: "notificationComment",
    follow: "notificationFollow",
    save: "notificationSave",
  };

  return t(keyByType[notification.type] || "notificationDefault").replace("{actor}", actor);
}

export function getTypeIcon(type) {
  if (type === "like") return "❤";
  if (type === "comment") return "💬";
  if (type === "follow") return "👤";
  if (type === "save") return "🔖";
  if (type === "pvp_challenge") return "⚔️";
  if (type === "challenge_attempt") return "🥊";
  if (type === "remix") return "🔀";
  if (type === "featured") return "⭐";
  if (type === "mention") return "💬";
  if (type === "new_follower") return "👤";
  if (type === "challenge_beaten") return "🏅";
  if (type === "coach_request") return "🥊";
  if (type === "gym_join_request") return "🏋️";
  if (type === "coach_accept") return "✅";
  if (type === "coach_decline") return "❌";
  if (type === "gym_approved") return "✅";
  if (type === "gym_declined") return "❌";
  if (type === "booking_scheduled") return "📅";
  if (type === "session_completed") return "🏆";
  if (type === "sparring_request") return "🥊";
  if (type === "sparring_accepted") return "✅";
  if (type === "event_rsvp") return "🏆";
  if (type === "event_reminder") return "🔔";
  return "•";
}

export function formatRelativeTime(timestamp, locale = "en", t = (k) => k) {
  const time = getTimestampMs(timestamp);
  if (!time) return "";

  const diffSeconds = Math.max(1, Math.floor((Date.now() - time) / 1000));
  if (diffSeconds < 60) return t("notifNow");

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return t("notifYesterday");
  if (diffDays < 7) return `${diffDays}d`;

  const d = new Date(time);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function getTimeGroup(timestamp) {
  const time = getTimestampMs(timestamp);
  if (!time) return "earlier";

  const date = new Date(time);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "today";
  if (date.toDateString() === yesterday.toDateString()) return "yesterday";
  return "earlier";
}

export const SOCIAL_TYPES = new Set(["like", "comment", "follow", "save", "new_follower", "pvp_challenge", "challenge_attempt", "challenge_beaten", "remix", "featured", "mention", "sparring_request", "sparring_accepted", "event_rsvp", "event_reminder"]);
export const COACH_TYPES = new Set(["coach_request", "coach_accept", "coach_decline", "booking_scheduled", "session_completed"]);
export const GYM_TYPES_NOTIF = new Set(["gym_join_request", "gym_approved", "gym_declined"]);
