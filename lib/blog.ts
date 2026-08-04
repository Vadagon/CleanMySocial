import fs from "fs";
import path from "path";

export const SUPER_DOWNLOADER_STORE_URL =
  "https://chromewebstore.google.com/detail/super-instagram-downloade/pggljleiefkdfimjhfclklchfkocjhgo";

export const IG_FOLLOWER_EXTRACTOR_STORE_URL =
  "https://chromewebstore.google.com/detail/kfaklckklmlknieiniakbekofgndfpbp";

export interface Promo {
  /** id referenced by articles */
  id: string;
  name: string;
  emoji: string;
  /** one-line pitch shown in the ad box */
  pitch: string;
  /** bullet points in the ad box */
  points: string[];
  /** primary CTA */
  ctaLabel: string;
  ctaHref: string;
  /** optional secondary link (e.g. pricing page on this site) */
  secondaryLabel?: string;
  secondaryHref?: string;
}

export const PROMOS: Record<string, Promo> = {
  "messenger-cleaner": {
    id: "messenger-cleaner",
    name: "Messenger Cleaner – Delete All Facebook Messages",
    emoji: "🧹",
    pitch:
      "Delete all your Facebook Messenger conversations in a few clicks — no more removing threads one at a time.",
    points: [
      "Bulk-deletes your entire Messenger inbox",
      "Runs in your own browser session — your messages are never uploaded",
      "Included with all three premium CleanMySocial tools for one $8 lifetime purchase",
    ],
    ctaLabel: "Add Messenger Cleaner to Chrome",
    ctaHref:
      "https://chromewebstore.google.com/detail/imobgpikmofiapbnijmebknbkmkncdkl",
    secondaryLabel: "Get the full bundle",
    secondaryHref: "/pricing",
  },
  "mass-unfriender": {
    id: "mass-unfriender",
    name: "Mass Friends Remover for Facebook — Bulk Unfriender",
    emoji: "👋",
    pitch:
      "Select many Facebook friends at once and unfriend them in bulk — instead of clicking through profiles one by one.",
    points: [
      "Checkboxes on your friends list, with Select All",
      "Removes friends with safe, randomized timing",
      "Included with all three premium CleanMySocial tools for one $8 lifetime purchase",
    ],
    ctaLabel: "Add Mass Unfriender to Chrome",
    ctaHref:
      "https://chromewebstore.google.com/detail/fegkbiinmaoipoonnlhekdoefgebmdnj",
    secondaryLabel: "Get the full bundle",
    secondaryHref: "/pricing",
  },
  "super-downloader": {
    id: "super-downloader",
    name: "Super Downloader for Instagram",
    emoji: "📥",
    pitch:
      "One-click downloads for Instagram photos, videos, Reels, Stories, and entire profiles — free forever, no login, no watermark.",
    points: [
      "Download buttons right inside Instagram — posts, Reels, Stories, Highlights",
      "Bulk-download whole profiles and Saved collections as a tidy ZIP",
      "100% free, no login, no ads, no tracking — runs entirely in your browser",
    ],
    ctaLabel: "Get Super Downloader — it's free",
    ctaHref: SUPER_DOWNLOADER_STORE_URL,
  },
  "ig-follower-extractor": {
    id: "ig-follower-extractor",
    name: "IG Follower Extractor",
    emoji: "📊",
    pitch:
      "Export any Instagram account's followers and following to CSV or Excel in one click — and instantly see who doesn't follow you back.",
    points: [
      "Export followers & following to CSV or real Excel (.xlsx)",
      "Finds non-followers and your fans automatically",
      "100% free, no login to third-party sites — runs entirely in your browser",
    ],
    ctaLabel: "Get IG Follower Extractor — it's free",
    ctaHref: IG_FOLLOWER_EXTRACTOR_STORE_URL,
  },
};

export interface ArticleMeta {
  slug: string;
  title: string;
  description: string;
  /** ISO date */
  date: string;
  /** promo id from PROMOS */
  promo: string;
  /** short category label for the index page */
  category: string;
}

const ALL_ARTICLES: ArticleMeta[] = [
  // ── Messenger Cleaner ────────────────────────────────────────────────
  {
    slug: "delete-all-facebook-messenger-messages",
    title: "How to Delete All Facebook Messenger Messages at Once (2026 Guide)",
    description:
      "Facebook still has no bulk-delete button. Here is the manual way to clear your Messenger inbox — and the fast way.",
    date: "2026-07-10",
    promo: "messenger-cleaner",
    category: "Messenger",
  },
  {
    slug: "messenger-delete-vs-archive-vs-unsend",
    title: "Delete vs. Archive vs. Unsend on Messenger: What Actually Disappears?",
    description:
      "The three ways to make a Messenger conversation go away do very different things. Here is what each one really removes.",
    date: "2026-07-08",
    promo: "messenger-cleaner",
    category: "Messenger",
  },
  {
    slug: "clean-up-facebook-before-deleting",
    title: "How to Clean Up Your Facebook Account Before Deleting It (Checklist)",
    description:
      "Deleting Facebook? Work through this checklist first so you leave nothing behind — messages, photos, apps, and more.",
    date: "2026-07-05",
    promo: "messenger-cleaner",
    category: "Messenger",
  },
  {
    slug: "what-facebook-knows-from-old-messages",
    title: "What Facebook Knows From Your Old Messages — and How to Minimize It",
    description:
      "Years of Messenger history is a detailed record of your life. Here is what it contains and how to shrink it.",
    date: "2026-07-02",
    promo: "messenger-cleaner",
    category: "Messenger",
  },
  {
    slug: "delete-messages-from-ex",
    title: "How to Mass-Delete Messages From an Ex (Digital Breakup Cleanup Guide)",
    description:
      "A practical guide to erasing an old relationship from Messenger, Instagram, and the rest of your digital life.",
    date: "2026-06-28",
    promo: "messenger-cleaner",
    category: "Messenger",
  },

  // ── Super Downloader (Instagram) ─────────────────────────────────────
  {
    slug: "download-instagram-media-devtools",
    title: "How to Download Instagram Photos & Videos Using Chrome DevTools (No Apps)",
    description:
      "A step-by-step guide to saving Instagram media with nothing but your browser's built-in developer tools.",
    date: "2026-07-09",
    promo: "super-downloader",
    category: "Instagram",
  },
  {
    slug: "save-instagram-stories",
    title: "How to Save Instagram Stories Before They Disappear (All Methods Compared)",
    description:
      "Screen recording, DevTools, downloader websites, and browser extensions — every way to save a Story, compared honestly.",
    date: "2026-07-06",
    promo: "super-downloader",
    category: "Instagram",
  },
  {
    slug: "never-login-to-instagram-downloader-sites",
    title: "Why You Should Never Log In to Instagram Downloader Websites",
    description:
      "Handing your Instagram password to a random website is how accounts get stolen. Here is what happens and what to use instead.",
    date: "2026-07-03",
    promo: "super-downloader",
    category: "Instagram",
  },
  {
    slug: "backup-entire-instagram-account",
    title: "How to Back Up Your Entire Instagram Account (Including Saved Posts)",
    description:
      "Instagram's official export misses a lot. Here is how to get a complete, usable backup of your account.",
    date: "2026-06-30",
    promo: "super-downloader",
    category: "Instagram",
  },
  {
    slug: "download-instagram-carousel",
    title: "How to Download an Instagram Carousel — Every Slide, Full Quality",
    description:
      "Carousels are the hardest Instagram posts to save. Two ways to get every slide in original quality.",
    date: "2026-06-26",
    promo: "super-downloader",
    category: "Instagram",
  },
  {
    slug: "is-it-legal-to-download-instagram",
    title: "Is It Legal to Download Instagram Content? A Practical Guide",
    description:
      "Copyright, Instagram's Terms of Service, and personal use — what you can and cannot do with downloaded content.",
    date: "2026-06-22",
    promo: "super-downloader",
    category: "Instagram",
  },
  {
    slug: "download-instagram-reels",
    title: "How to Download Instagram Reels in HD Without a Watermark (2026)",
    description:
      "Save any Instagram Reel as a clean MP4 in full quality — no watermark, no login, no shady websites.",
    date: "2026-07-11",
    promo: "super-downloader",
    category: "Instagram",
  },
  {
    slug: "bulk-download-instagram-profile",
    title: "How to Bulk-Download an Entire Instagram Profile (Photos, Videos & Reels)",
    description:
      "Save every post from a public Instagram profile at once, neatly zipped — instead of right-clicking one image at a time.",
    date: "2026-07-05",
    promo: "super-downloader",
    category: "Instagram",
  },

  // ── IG Follower Extractor (Instagram followers) ──────────────────────
  {
    slug: "export-instagram-followers-to-excel",
    title: "How to Export Your Instagram Followers to Excel or CSV (2026 Guide)",
    description:
      "Instagram has no export button. Here is how to get your full followers list into a clean Excel or CSV file in one click.",
    date: "2026-07-14",
    promo: "ig-follower-extractor",
    category: "Instagram followers",
  },
  {
    slug: "who-doesnt-follow-me-back-instagram",
    title: "How to See Who Doesn't Follow You Back on Instagram (Free Method)",
    description:
      "Find every account you follow that doesn't follow you back — without giving your password to a sketchy app.",
    date: "2026-07-12",
    promo: "ig-follower-extractor",
    category: "Instagram followers",
  },
  {
    slug: "export-instagram-following-list",
    title: "How to Export Your Instagram Following List to a Spreadsheet",
    description:
      "Get a complete, sortable list of every account you follow — exported to CSV or Excel for backup and analysis.",
    date: "2026-07-09",
    promo: "ig-follower-extractor",
    category: "Instagram followers",
  },
  {
    slug: "instagram-follower-audit",
    title: "How to Audit Your Instagram Followers (Find Ghosts, Fakes & Non-Followers)",
    description:
      "A simple, spreadsheet-based way to see who really engages, who never follows back, and who to clean out.",
    date: "2026-07-06",
    promo: "ig-follower-extractor",
    category: "Instagram followers",
  },
  {
    slug: "backup-instagram-followers-list",
    title: "How to Back Up Your Instagram Followers List (Before You Lose It)",
    description:
      "Accounts get hacked, banned, and locked every day. Here is how to keep an offline copy of your followers and following.",
    date: "2026-07-02",
    promo: "ig-follower-extractor",
    category: "Instagram followers",
  },

  // ── Mass Unfriender ──────────────────────────────────────────────────
  {
    slug: "unfriend-multiple-facebook-friends-at-once",
    title: "How to Unfriend Multiple People on Facebook at Once (2026 Guide)",
    description:
      "Facebook makes you remove friends one profile at a time. Here is the manual method — and the bulk method.",
    date: "2026-07-07",
    promo: "mass-unfriender",
    category: "Facebook friends",
  },
  {
    slug: "unfriend-vs-unfollow-vs-restrict-vs-block",
    title: "Unfriend vs. Unfollow vs. Restrict vs. Block: What Each Actually Does",
    description:
      "Facebook gives you four ways to get someone out of your feed. They are very different — pick the right one.",
    date: "2026-07-04",
    promo: "mass-unfriender",
    category: "Facebook friends",
  },
  {
    slug: "facebook-friends-list-cleanup",
    title: "How to Do a Facebook Friends List Cleanup (Step-by-Step Method)",
    description:
      "A simple framework for deciding who stays and who goes — and how to remove the 'goes' pile in minutes.",
    date: "2026-07-01",
    promo: "mass-unfriender",
    category: "Facebook friends",
  },
  {
    slug: "does-facebook-notify-unfriend",
    title: "Does Facebook Notify Someone When You Unfriend Them?",
    description:
      "The short answer is no — but there are ways people can notice. Here is exactly what happens when you unfriend.",
    date: "2026-06-27",
    promo: "mass-unfriender",
    category: "Facebook friends",
  },
  {
    slug: "privacy-risks-bloated-friends-list",
    title: "Why Fewer Facebook Friends Is Better: Privacy Risks of a Bloated Friends List",
    description:
      "Every 'friend' you forgot about can still see your posts, photos, and life events. Here is why that matters.",
    date: "2026-06-24",
    promo: "mass-unfriender",
    category: "Facebook friends",
  },
  {
    slug: "remove-inactive-fake-facebook-friends",
    title: "How to Find and Remove Inactive or Fake Facebook Friends",
    description:
      "Dead accounts, strangers, and bots clutter your friends list and weaken your privacy. Here is how to purge them.",
    date: "2026-06-20",
    promo: "mass-unfriender",
    category: "Facebook friends",
  },
];

export const ARTICLES = ALL_ARTICLES.filter(
  (article) =>
    article.category === "Messenger" || article.category === "Facebook friends"
);

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

export function getArticle(slug: string): (ArticleMeta & { body: string }) | undefined {
  const meta = ARTICLES.find((a) => a.slug === slug);
  if (!meta) return undefined;
  const body = fs.readFileSync(path.join(CONTENT_DIR, `${slug}.md`), "utf8");
  return { ...meta, body };
}
