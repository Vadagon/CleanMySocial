/**
 * The product description Creem shows on its checkout page and in its own
 * product list. One source for both the creation script and the updater, so a
 * new product can never go live with different wording from the rest.
 *
 * It says what the tool does, exactly what is being bought, and how the
 * licence arrives. A buyer who cannot tell a 3-day pass from a subscription
 * disputes the charge instead of asking.
 */

/** What each tool does and what Pro adds, keyed by entitlement slug. */
const TOOLS = {
  "facebook-instagram-cleaner": {
    does: "Bulk-deletes Facebook Messenger conversations and Instagram DMs.",
    pro: "Pro removes the daily free limit and unlocks the fastest speed.",
    limits: "Facebook's and Instagram's",
  },
  "facebook-messenger-cleaner": {
    does: "Bulk-deletes Facebook Messenger conversations.",
    pro: "Pro removes the daily free limit and unlocks the fastest speed.",
    limits: "Facebook's",
  },
  "mass-unfriender": {
    does: "Removes Facebook friends in bulk.",
    pro: "Pro removes the daily free limit and unlocks the fastest speed.",
    limits: "Facebook's",
  },
  "instagram-dm-cleaner": {
    does: "Bulk-unsends the Instagram messages you sent.",
    pro: "Pro removes the daily free limit and unlocks the fastest speed.",
    limits: "Instagram's",
  },
  "instagram-followers-tracker": {
    does: "Shows who doesn't follow you back on Instagram.",
    // No speed ladder here: see docs/CONVERSION.md, Followers Tracker exception.
    pro: "Scanning is free; Pro unlocks unfollowing from the list.",
    limits: "Instagram's",
  },
  "reddit-cleaner": {
    does: "Bulk-deletes your Reddit posts and comments.",
    pro: "Pro removes the daily free limit and unlocks the fastest speed.",
    limits: "Reddit's",
  },
  cleanerx: {
    does: "Bulk-deletes your tweets, reposts and likes on X.",
    pro: "Pro removes the daily free limit and unlocks the fastest speed.",
    limits: "X's",
  },
  "facebook-activity-cleaner": {
    does: "Bulk-deletes posts, comments, likes and tags from your Facebook Activity Log.",
    pro: "Pro removes the daily free limit and unlocks the fastest speed.",
    limits: "Facebook's",
  },
  "gmail-cleaner": {
    does: "Unsubscribes you from unwanted senders and bulk-deletes their emails.",
    // Every run is full speed for everyone; Pro is never described as faster.
    pro: "Pro removes the daily free limits.",
    limits: "Gmail's",
  },
};

const PLAN = {
  pass: "3-Day Pass: one payment. Pro access for 3 days from purchase, then it ends by itself. Not a subscription; nothing to cancel.",
  subscription: "Monthly: a subscription. Charged every month until you cancel; cancel any time from your Creem receipt email.",
  lifetime: "Lifetime: one payment, no renewal.",
};

/**
 * @param {{ slug: string, tool: string, access: "pass" | "subscription" | "lifetime", promotion?: string }} product
 */
export function creemDescription({ slug, tool, access, promotion }) {
  const copy = TOOLS[slug];
  if (!copy) throw new Error(`No Creem description copy for ${slug}`);
  const plan = promotion === "uninstall_50" ? `Private 50% uninstall offer. ${PLAN[access]}` : PLAN[access];
  return [
    `${copy.does} ${copy.pro}`,
    `This is the Pro upgrade for the ${tool} Chrome extension. It runs in desktop Chrome on your own logged-in account, at a speed limited by ${copy.limits} own rate limits.`,
    plan,
    "Your licence key is emailed right after payment; paste it into the extension to activate.",
  ].join("\n\n");
}
