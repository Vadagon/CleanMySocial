export interface GuideTopic {
  slug: string;
  category:
    | "Messenger"
    | "Facebook friends"
    | "Facebook activity"
    | "Instagram messages"
    | "Instagram followers"
    | "Reddit"
    | "X"
    | "Feeds";
  emoji: string;
  shortTitle: string;
  title: string;
  description: string;
  answer: string;
  productName: string;
  productHref: string;
  productFit: string;
}

export const GUIDE_TOPICS: GuideTopic[] = [
  {
    slug: "messenger-cleanup",
    category: "Messenger",
    emoji: "🧹",
    shortTitle: "Clean Messenger",
    title: "Facebook Messenger cleanup guides",
    description:
      "Understand delete, archive, and unsend, then choose the right way to clear old Messenger conversations.",
    answer:
      "Use Archive when you only want a tidier inbox, Unsend for an individual message you sent, and Delete when you want to remove a conversation from your own inbox. For many conversations, Messenger Cleaner automates the repetitive delete flow in your signed-in browser.",
    productName: "Messenger Cleaner",
    productHref: "/facebook-messenger-cleaner",
    productFit:
      "Best for people who want to remove many Messenger conversations from their own inbox without opening each chat manually.",
  },
  {
    slug: "facebook-friend-cleanup",
    category: "Facebook friends",
    emoji: "👋",
    shortTitle: "Clean Facebook friends",
    title: "Facebook friends list cleanup guides",
    description:
      "Decide who to remove, understand unfriend versus unfollow or block, and work through a large friends list.",
    answer:
      "Use Unfollow when you only want fewer posts, Unfriend when you want to remove the mutual connection, and Block when you need to prevent contact or profile access. Mass Unfriender adds selection controls for a larger cleanup in your signed-in browser.",
    productName: "Mass Friends Remover for Facebook",
    productHref: "/mass-unfriender",
    productFit:
      "Best for people who have already decided to remove multiple Facebook friends and want one review screen instead of visiting profiles one by one.",
  },
  {
    slug: "facebook-activity-cleanup",
    category: "Facebook activity",
    emoji: "🗂️",
    shortTitle: "Clean Facebook activity",
    title: "Facebook Activity Log cleanup guides",
    description:
      "Filter and review Facebook posts, photos, comments, likes, reactions, and tags before changing them in batches.",
    answer:
      "Start in Facebook Activity Log, use Facebook's own filters to define the scope, and test a small batch before processing more. Activity Log Cleaner keeps every action visible and can pause or stop a run.",
    productName: "Activity Log Cleaner",
    productHref: "/facebook-activity-cleaner",
    productFit:
      "Best for people who need to work through many visible Activity Log items while retaining Facebook's own filtering and recovery behavior.",
  },
  {
    slug: "instagram-message-cleanup",
    category: "Instagram messages",
    emoji: "💬",
    shortTitle: "Clean Instagram messages",
    title: "Instagram message cleanup guides",
    description:
      "Understand conversation deletion, message ownership, unsending, date filters, privacy, and Instagram rate limits.",
    answer:
      "Instagram lets your account unsend messages it sent, but not messages authored by another account. DM Cleaner scans one open conversation and processes the reviewed sent-message selection in your browser.",
    productName: "Instagram DM Cleaner",
    productHref: "/instagram-dm-cleaner",
    productFit:
      "Best for people who need to review and unsend many messages sent by their own account from one Instagram conversation.",
  },
  {
    slug: "instagram-follower-management",
    category: "Instagram followers",
    emoji: "📊",
    shortTitle: "Manage Instagram followers",
    title: "Instagram follower management guides",
    description:
      "Compare followers and following, find non-followers, preserve history, and export your own account lists.",
    answer:
      "Compare your followers and following lists to identify non-followers, and keep dated scans if you want to spot changes over time. Followers Tracker performs that comparison in your existing browser session; Pro adds spreadsheet exports and bulk actions.",
    productName: "Followers Tracker for Instagram",
    productHref: "/instagram-followers-tracker",
    productFit:
      "Best for people who want local follower history, a non-follower comparison, or CSV and Excel exports for their own Instagram account.",
  },
  {
    slug: "reddit-history-cleanup",
    category: "Reddit",
    emoji: "🧹",
    shortTitle: "Clean Reddit history",
    title: "Reddit post and comment cleanup guides",
    description:
      "Filter Reddit history, understand overwrite and deletion, protect important items, and respect platform limits.",
    answer:
      "Scan first, filter by content type, subreddit, age, karma, or keyword, and review every match. Reddit Cleaner can optionally overwrite editable text before deleting the selected items.",
    productName: "Reddit Cleaner",
    productHref: "/reddit-cleaner",
    productFit:
      "Best for people cleaning their own Reddit posts and comments who need precise filters and a review step before deletion.",
  },
  {
    slug: "x-account-cleanup",
    category: "X",
    emoji: "✕",
    shortTitle: "Clean an X account",
    title: "X post, like, and following cleanup guides",
    description:
      "Delete reachable posts, remove likes, mass unfollow carefully, and understand X timeline and rate-limit boundaries.",
    answer:
      "Download the account archive first, choose one cleanup workflow, and run a small test. CleanerX separates post, repost, like, unfollow, block, and mute actions so each run remains understandable.",
    productName: "CleanerX",
    productHref: "/cleanerx",
    productFit:
      "Best for people cleaning the recent activity X exposes through the signed-in browser interface, with test mode and progress recovery.",
  },
  {
    slug: "hide-social-media-feeds",
    category: "Feeds",
    emoji: "🧘",
    shortTitle: "Hide distracting feeds",
    title: "Social feed and distraction-blocking guides",
    description:
      "Hide feeds, Shorts, Reels, stories, suggestions, and trends while keeping intentional social-network features available.",
    answer:
      "Use a visual feed blocker when the goal is focus rather than deletion. CleanFeed hides selected sections on six networks without changing posts, follows, messages, or account data.",
    productName: "CleanFeed",
    productHref: "/cleanfeed",
    productFit:
      "Best for people who want a reversible way to reduce passive scrolling while keeping search, messaging, profiles, and notifications.",
  },
];

export function getGuideTopic(slug: string) {
  return GUIDE_TOPICS.find((topic) => topic.slug === slug);
}
