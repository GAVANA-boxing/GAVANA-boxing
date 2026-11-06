/**
 * Single source of truth for Firestore collection names. Importing these
 * instead of hardcoding strings prevents the kind of drift the audit found
 * (e.g. "programs" vs "training_programs", "feedback" vs "ai_feedback").
 */
export const COLLECTIONS = {
  users: "users",
  /** Owner-only private fields (email…). `users` is publicly readable, so nothing private may live there. */
  usersPrivate: "users_private",
  reels: "reels",
  reelStats: "reel_stats",
  reelViews: "reel_views",
  aiFeedback: "ai_feedback",
  trainingSessions: "training_sessions",
  trainingPrograms: "training_programs",
  userTrainingProfile: "user_training_profile",
  challengeResults: "challenge_results",
  leaderboard: "leaderboard",
  follows: "follows",
  notifications: "notifications",
  userLikes: "user_likes",
  savedReels: "saved_reels",
  conversations: "conversations",
  gyms: "gyms",
  gymJoinRequests: "gym_join_requests",
  coachReviews: "coach_reviews",
  sparringPosts: "sparring_posts",
  events: "events",
  stories: "stories",
  storyReactions: "story_reactions",
  analyticsEvents: "analytics_events",
  reports: "reports",
  featuredCreators: "featured_creators",
  userBadges: "user_badges",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
