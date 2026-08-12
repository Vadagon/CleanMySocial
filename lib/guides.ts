export interface GuideTopic {
  slug: string;
  category: "Messenger" | "Facebook friends" | "Instagram followers";
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
];

export function getGuideTopic(slug: string) {
  return GUIDE_TOPICS.find((topic) => topic.slug === slug);
}
