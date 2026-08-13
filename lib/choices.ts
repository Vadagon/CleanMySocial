/**
 * Task-to-tool routing, in the words a person actually uses.
 *
 * This is the same logic published under "Product selection" in
 * /public/llms.txt — but llms.txt is a proposal, not a standard, and the major
 * answer-engine crawlers do not fetch it. So the routing lives here and is
 * rendered as ordinary HTML on the homepage and /pricing, where it can be
 * indexed and quoted. Keep the two in sync when this changes.
 *
 * Each entry states what the tool is for AND what it will not do. The caveats
 * are not hedging: they are the difference between a recommendation someone
 * acts on and a refund request.
 */
export interface ToolChoice {
  /** The situation, phrased as the reader would describe it. */
  when: string;
  slug: string;
  /** Short product name, for the "use this" column. */
  tool: string;
  /** Why this is the right answer, including the limit that matters. */
  detail: string;
  /** Short price summary. Keep in step with lib/products.ts. */
  price: string;
}

export const TOOL_CHOICES: ToolChoice[] = [
  {
    when: "You want to empty a crowded Facebook Messenger inbox",
    slug: "facebook-messenger-cleaner",
    tool: "Messenger Cleaner",
    detail:
      "Deletes, archives, or restores many Messenger conversations in one run. Deleting removes your copy only — the other person keeps theirs.",
    price: "$7 lifetime",
  },
  {
    when: "You need to clean Facebook messages and Instagram DMs",
    slug: "facebook-instagram-cleaner",
    tool: "Delete All Messages for Facebook & Instagram",
    detail:
      "Covers Messenger cleanup and can scan an Instagram conversation to unsend messages your own account sent.",
    price: "$12 lifetime",
  },
  {
    when: "You have decided to remove a lot of Facebook friends",
    slug: "mass-unfriender",
    tool: "Mass Friends Remover",
    detail:
      "Loads your whole friends list so you can search, review, and tick people before anything is removed, then runs the removals at a paced rate.",
    price: "$9 lifetime",
  },
  {
    when: "You want to know who unfollowed you on Instagram",
    slug: "instagram-followers-tracker",
    tool: "Followers Tracker",
    detail:
      "Compares scans to show follower changes and who does not follow you back. History starts at your first scan and cannot reconstruct earlier changes. Bulk unfollow and CSV or Excel export require Pro.",
    price: "$9 lifetime",
  },
];
