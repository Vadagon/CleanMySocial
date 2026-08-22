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
  /** First-party product page used for internal discovery and comparison. */
  detailHref?: string;
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
      "Available separately, in a discounted message-cleaning pair, or with every CleanMySocial tool",
    ],
    ctaLabel: "Add Messenger Cleaner to Chrome",
    ctaHref:
      "https://chromewebstore.google.com/detail/imobgpikmofiapbnijmebknbkmkncdkl",
    detailHref: "/facebook-messenger-cleaner",
    secondaryLabel: "See pricing",
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
      "Available separately, in a discounted Facebook pair, or with every CleanMySocial tool",
    ],
    ctaLabel: "Add Mass Unfriender to Chrome",
    ctaHref:
      "https://chromewebstore.google.com/detail/fegkbiinmaoipoonnlhekdoefgebmdnj",
    detailHref: "/mass-unfriender",
    secondaryLabel: "See pricing",
    secondaryHref: "/pricing",
  },
  "reddit-cleaner": {
    id: "reddit-cleaner",
    name: "Reddit Cleaner – Bulk Delete Posts, Comments & History",
    emoji: "🧹",
    pitch:
      "Filter your Reddit history, review exactly what matches, then overwrite and delete it in one run.",
    points: [
      "Filter by subreddit, age, score or keyword",
      "Review every matching item before anything is deleted",
      "Optionally overwrite text before deleting",
      "Runs in your own browser session",
    ],
    ctaLabel: "Add Reddit Cleaner to Chrome",
    ctaHref: "https://chromewebstore.google.com/detail/ghddfkljkcojgpdngeaglannonehpldh",
    detailHref: "/reddit-cleaner",
    secondaryLabel: "See pricing",
    secondaryHref: "/pricing",
  },
  cleanfeed: {
    id: "cleanfeed",
    name: "CleanFeed — Hide Social Media Feeds",
    emoji: "🧘",
    pitch:
      "Hide the feed on six networks and keep everything else working. Free, no account, no limits.",
    points: [
      "Facebook, Instagram, YouTube, Reddit, X and LinkedIn",
      "A switch per section — feed, stories, Shorts, suggestions",
      "Pause it for 5 minutes or the rest of the day",
      "Nothing is deleted or changed on your account",
    ],
    ctaLabel: "Add CleanFeed to Chrome — free",
    ctaHref: "https://chromewebstore.google.com/detail/efebojaacbocpjiiimmjnjpnhlihmjee",
    detailHref: "/cleanfeed",
  },
  cleanerx: {
    id: "cleanerx",
    name: "CleanerX — X (Twitter) Bulk Cleaner",
    emoji: "🧹",
    pitch:
      "Delete posts, reposts and likes, unfollow, block or mute — paced against X's limits so a long run survives.",
    points: [
      "Keyword and age filters",
      "Safe-test mode stops after 10 items",
      "Progress survives a rate-limit pause",
      "Runs in your own signed-in session",
    ],
    ctaLabel: "Add CleanerX to Chrome",
    ctaHref: "https://chromewebstore.google.com/detail/efkdbehpkfaiehogkiokbiecjdbiebgi",
    detailHref: "/cleanerx",
    secondaryLabel: "See pricing",
    secondaryHref: "/pricing",
  },
  "facebook-activity-cleaner": {
    id: "facebook-activity-cleaner",
    name: "Delete All Facebook Posts & Photos — Activity Log Cleaner",
    emoji: "🗂️",
    pitch:
      "Work down the Activity Log in bulk — delete, hide, unlike or untag, whichever you chose.",
    points: [
      "Posts, photos, comments, likes, reactions and tags",
      "Each item scrolled into view so you can watch the run",
      "Pause or stop at any moment",
      "Uses Facebook's own menus in your tab",
    ],
    ctaLabel: "Add Activity Log Cleaner to Chrome",
    ctaHref: "https://chromewebstore.google.com/detail/iaimbgcccpmmdgpmkkcaiilgdeobgmcl",
    detailHref: "/facebook-activity-cleaner",
    secondaryLabel: "See pricing",
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
    name: "Followers Tracker for Instagram",
    emoji: "📊",
    pitch:
      "Track unfollowers, find accounts that do not follow you back, bulk unfollow safely, and export your own lists to CSV or Excel.",
    points: [
      "Manual scans, history, and one-by-one unfollows are free",
      "Pro adds daily alerts, bulk unfollow, and CSV or Excel exports",
      "Uses your existing Instagram session and stores follower history locally",
    ],
    ctaLabel: "Add Followers Tracker to Chrome",
    ctaHref: IG_FOLLOWER_EXTRACTOR_STORE_URL,
    detailHref: "/instagram-followers-tracker",
    secondaryLabel: "Compare all pricing",
    secondaryHref: "/pricing",
  },
};

export interface ArticleMeta {
  slug: string;
  title: string;
  description: string;
  /** ISO date */
  date: string;
  /** ISO date when instructions were most recently checked against the live products */
  updated?: string;
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
    updated: "2026-08-12",
    promo: "messenger-cleaner",
    category: "Messenger",
  },
  {
    slug: "messenger-delete-vs-archive-vs-unsend",
    title: "Delete vs. Archive vs. Unsend on Messenger: What Actually Disappears?",
    description:
      "The three ways to make a Messenger conversation go away do very different things. Here is what each one really removes.",
    date: "2026-07-08",
    updated: "2026-08-12",
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
    updated: "2026-08-12",
    promo: "ig-follower-extractor",
    category: "Instagram followers",
  },
  {
    slug: "who-doesnt-follow-me-back-instagram",
    title: "How to See Who Doesn't Follow You Back on Instagram (Free Method)",
    description:
      "Find every account you follow that doesn't follow you back — without giving your password to a sketchy app.",
    date: "2026-07-12",
    updated: "2026-08-12",
    promo: "ig-follower-extractor",
    category: "Instagram followers",
  },
  {
    slug: "export-instagram-following-list",
    title: "How to Export Your Instagram Following List to a Spreadsheet",
    description:
      "Get a complete, sortable list of every account you follow — exported to CSV or Excel for backup and analysis.",
    date: "2026-07-09",
    updated: "2026-08-12",
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
    updated: "2026-08-12",
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
  {
    slug: "delete-all-reddit-comments",
    title: "How to Delete All Your Reddit Comments (and What Survives Anyway)",
    description:
      "Deleting detaches your username; it does not reach copies already taken. Why you overwrite first, and the listing limit that caps how far back anyone can reach.",
    date: "2026-08-22",
    updated: "2026-08-22",
    promo: "reddit-cleaner",
    category: "Reddit",
  },
  {
    slug: "hide-facebook-news-feed",
    title: "How to Hide the Facebook News Feed (Without Deleting Anything)",
    description:
      "Facebook has no off switch for the feed. The two real options, what each costs, and why unfollowing everyone doesn't keep it empty.",
    date: "2026-08-22",
    updated: "2026-08-22",
    promo: "cleanfeed",
    category: "Feeds",
  },
  {
    slug: "turn-off-youtube-shorts",
    title: "How to Turn Off YouTube Shorts (All Three Places It Reaches You)",
    description:
      "\"Not interested\" is feedback, not a rule. The sidebar button everyone forgets, and the URL trick that plays a Short without the swipe loop.",
    date: "2026-08-22",
    updated: "2026-08-22",
    promo: "cleanfeed",
    category: "Feeds",
  },
  {
    slug: "hide-linkedin-feed",
    title: "How to Hide the LinkedIn Feed and Still Use LinkedIn",
    description:
      "Unfollowing barely dents it, because most of the feed is suggested rather than followed. What you keep once the feed is gone.",
    date: "2026-08-22",
    updated: "2026-08-22",
    promo: "cleanfeed",
    category: "Feeds",
  },
  {
    slug: "instagram-without-the-feed",
    title: "Instagram Without the Feed: What to Hide and What to Keep",
    description:
      "The chronological Following feed exists and Instagram won't let you keep it. The four things stitched into Home, and which are worth removing.",
    date: "2026-08-22",
    updated: "2026-08-22",
    promo: "cleanfeed",
    category: "Feeds",
  },
  {
    slug: "delete-all-tweets",
    title: "How to Delete All Your Tweets (and the Wall You'll Hit)",
    description:
      "X's timeline stops paging back after a few thousand posts, so an old account can't be cleared through the interface. Get the archive first.",
    date: "2026-08-22",
    updated: "2026-08-22",
    promo: "cleanerx",
    category: "X",
  },
  {
    slug: "mass-unfollow-x-rate-limits",
    title: "Mass Unfollowing on X Without Getting Your Account Limited",
    description:
      "Unfollowing is a write action, and going too fast restricts posting too — not just unfollowing. How to pace it and what rule to decide first.",
    date: "2026-08-22",
    updated: "2026-08-22",
    promo: "cleanerx",
    category: "X",
  },
  {
    slug: "empty-facebook-activity-log",
    title: "How to Empty Your Facebook Activity Log",
    description:
      "Delete, hide and untag are three different outcomes, and hiding isn't deleting. Plus the 30-day trash that makes \"deleted\" recoverable for a month.",
    date: "2026-08-22",
    updated: "2026-08-22",
    promo: "facebook-activity-cleaner",
    category: "Facebook activity",
  },
  {
    slug: "what-delete-really-means",
    title: "What \"Delete\" Actually Means on Each Social Network",
    description:
      "Your copy, both copies, attribution only, or a 30-day trash — the button means something different on every platform. Which one you're getting.",
    date: "2026-08-22",
    updated: "2026-08-22",
    promo: "cleanfeed",
    category: "Feeds",
  },
];

const PUBLISHED_CATEGORIES = new Set([
  "Messenger",
  "Facebook friends",
  "Instagram followers",
  "Reddit",
  "X",
  "Feeds",
  "Facebook activity",
]);

export const ARTICLES = ALL_ARTICLES.filter((article) =>
  PUBLISHED_CATEGORIES.has(article.category)
);

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

export function getArticle(slug: string): (ArticleMeta & { body: string }) | undefined {
  const meta = ARTICLES.find((a) => a.slug === slug);
  if (!meta) return undefined;
  const body = fs.readFileSync(path.join(CONTENT_DIR, `${slug}.md`), "utf8");
  return { ...meta, body };
}
