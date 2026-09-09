export type EditorialFunnel = "Transactional" | "Commercial" | "Informational";

export interface EditorialArticle {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  promo: string;
  category: string;
  primaryKeyword: string;
  productHref: string;
  pillar?: boolean;
  pillarSlug?: string;
  relatedSlugs?: string[];
  body: string;
}

interface ArticleSeed {
  slug: string;
  title: string;
  description: string;
  primaryKeyword: string;
  funnel: EditorialFunnel;
  answer: string;
  focus: [string, string, string];
}

interface Series {
  promo: string;
  category: string;
  productName: string;
  productHref: string;
  pillarSlug: string;
  workflow: [string, string, string, string];
  limits: [string, string, string];
  articles: ArticleSeed[];
}

const START_DATE = new Date("2026-09-10T00:00:00Z");

const isoDate = (index: number) => {
  const date = new Date(START_DATE);
  date.setUTCDate(date.getUTCDate() + Math.floor(index / 2));
  return date.toISOString().slice(0, 10);
};

const link = (slug: string, label: string) => `[${label}](/blog/${slug})`;

function buildBody(seed: ArticleSeed, series: Series) {
  const intentParagraph = seed.funnel === "Transactional"
    ? `This guide is for someone ready to complete the cleanup now. Start with a small, reversible selection where possible, confirm the result, and only then expand the batch.`
    : seed.funnel === "Commercial"
      ? `The useful comparison is not simply manual versus automatic. Look for clear selection controls, visible progress, a stop control, realistic platform limits, and processing that stays in the signed-in browser session.`
      : `The important distinction is what the social network itself allows. A browser extension can reduce repetitive work, but it cannot erase another person's copy, bypass platform limits, or recover information the platform no longer exposes.`;

  return `**Short answer:** ${seed.answer}

${seed.description} This guide focuses specifically on **${seed.primaryKeyword}** and keeps that job separate from the broader ${series.category.toLowerCase()} guide.

## What matters for this task

- ${seed.focus[0]}
- ${seed.focus[1]}
- ${seed.focus[2]}

${intentParagraph}

## A practical workflow

1. ${series.workflow[0]}
2. ${series.workflow[1]}
3. ${series.workflow[2]}
4. ${series.workflow[3]}

[[PROMO]]

## Important limits

- ${series.limits[0]}
- ${series.limits[1]}
- ${series.limits[2]}

These limits are part of the platform, not a reason to hide what the tool is doing. ${series.productName} keeps the work visible so you can verify the scope and stop when the result is not what you expected.

## Keep the cleanup controlled

For a large account, do not begin with the largest possible batch. Test the workflow on a handful of items, check the result in the social network, and preserve anything you may need later. If the platform provides an archive, download, or trash option, use it before an irreversible action.

The extension works through the account already signed in to Chrome. CleanMySocial does not need a separate copy of the private messages, friends list, follower list, or account history being processed.

## Continue with the right guide

Start with the ${link(series.pillarSlug, `complete ${series.category.toLowerCase()} guide`)} if you have not chosen a workflow yet. The related-guide block below reveals narrower articles only after they are published, so readers never land on a scheduled page early. You can also review the product's features, limitations, privacy details, and pricing on the [${series.productName} page](${series.productHref}).

## Bottom line

${seed.answer} Keep the first run small, verify what the platform changed, and use a broader batch only after the result matches your intention.`;
}

const SERIES: Series[] = [
  {
    promo: "messenger-cleaner",
    category: "Messenger",
    productName: "Messenger Cleaner",
    productHref: "/facebook-messenger-cleaner",
    pillarSlug: "delete-all-facebook-messenger-messages",
    workflow: [
      "Open Facebook Messenger in desktop Chrome and decide whether the conversations should be deleted, archived, or restored.",
      "Open Messenger Cleaner, load the available conversation list, and select only the chats that match the intended scope.",
      "Confirm a small test batch and keep the Messenger tab visible while the run proceeds.",
      "Check the result in Messenger before continuing with the rest of the inbox.",
    ],
    limits: [
      "Deleting a conversation removes your copy; it does not erase the other participant's inbox.",
      "The tool works with conversations, not hundreds of individual message bubbles inside one chat.",
      "Facebook interface changes and action limits can slow or temporarily interrupt a large run.",
    ],
    articles: [
      { slug:"bulk-delete-messenger-messages", title:"Bulk Delete Messenger Messages: The Fastest Safe Desktop Workflow", description:"Compare one-by-one Messenger cleanup with a controlled bulk run that keeps selection and progress visible.", primaryKeyword:"bulk delete messenger messages", funnel:"Transactional", answer:"Use a desktop selection workflow, verify a small batch, and then process the remaining Messenger conversations you chose.", focus:["Select conversations before anything runs.","Use visible progress and a stop control for a large inbox.","Remember that conversation deletion affects your copy only."] },
      { slug:"delete-every-messenger-conversation", title:"How to Delete Every Messenger Conversation at Once", description:"Understand the difference between removing conversations and deleting individual messages before clearing a Messenger inbox.", primaryKeyword:"delete all messenger conversations", funnel:"Transactional", answer:"Messenger has no native select-all button, but a Chrome side-panel workflow can process selected conversations one by one.", focus:["Treat a conversation as the unit of cleanup.","Archive uncertain chats instead of deleting them.","Export important information before a large run."] },
      { slug:"delete-facebook-messenger-messages-in-bulk", title:"Delete Facebook Messenger Messages in Bulk: What Works in Chrome", description:"Review the practical Chrome options for cleaning a large Facebook Messenger inbox without opening every conversation manually.", primaryKeyword:"delete facebook messenger messages in bulk", funnel:"Commercial", answer:"A browser tool should automate Facebook's visible controls while keeping selection, confirmation, and stopping under your control.", focus:["Avoid services asking for passwords or session cookies.","Prefer a side panel that works in the signed-in tab.","Confirm exactly whether the tool deletes or archives."] },
      { slug:"clear-all-facebook-messages", title:"How to Clear All Facebook Messages at Once: Delete, Archive, or Restore", description:"Choose between deleting, archiving, and restoring Messenger conversations based on what you actually want to keep.", primaryKeyword:"how to clear all facebook messages at once", funnel:"Informational", answer:"Archive for a reversible cleanup, delete only when you no longer need your copy, and restore chats that were archived by mistake.", focus:["Delete and archive have different recovery outcomes.","Restoring does not recreate a permanently deleted chat.","The other participant keeps their own copy."] },
      { slug:"can-you-delete-all-messenger-messages", title:"Can You Delete All Messenger Messages at Once? Limits and Privacy Explained", description:"Get a direct answer about bulk Messenger deletion, the other participant's copy, browser privacy, and platform limitations.", primaryKeyword:"can i delete all my messenger messages at once", funnel:"Informational", answer:"You can automate removal of conversations from your inbox, but you cannot bulk-erase the other participants' copies.", focus:["Separate inbox cleanup from Delete for everyone.","Keep message content inside the signed-in browser.","Expect Facebook pacing and interface limits."] },
      { slug:"delete-facebook-messenger-messages-desktop", title:"How to Delete All Facebook Messenger Messages on Desktop", description:"Follow a desktop-only workflow for preparing, selecting, confirming, and checking a large Messenger cleanup.", primaryKeyword:"how to delete all facebook messenger messages at once", funnel:"Transactional", answer:"Desktop Chrome is the practical option for reviewing many conversations together because mobile Messenger still handles them individually.", focus:["Use desktop Chrome rather than expecting a mobile extension.","Keep the correct Messenger tab visible.","Check archived and deleted results separately."] },
      { slug:"messenger-large-inbox-cleanup-checklist", title:"Messenger Inbox Cleanup Checklist for Large Message Histories", description:"Use a staged checklist to back up important chats, archive uncertain conversations, and remove an old Messenger backlog.", primaryKeyword:"delete all facebook messenger messages", funnel:"Commercial", answer:"Back up first, archive uncertain chats, test deletion on a small selection, and only then process the larger inbox.", focus:["Decide what must be preserved before selecting anything.","Use archive as a temporary holding area.","Record where a stopped batch should resume."] },
    ],
  },
  {
    promo: "mass-unfriender",
    category: "Facebook friends",
    productName: "Mass Friends Remover",
    productHref: "/mass-unfriender",
    pillarSlug: "unfriend-multiple-facebook-friends-at-once",
    workflow: [
      "Open the Facebook friends list in Chrome and load a fresh copy of the full list.",
      "Search, filter, and select the people you intend to remove instead of starting with Select all.",
      "Review the selection, protect anyone you are unsure about, and confirm a small first batch.",
      "Let the removal run at a paced speed, then verify the changes directly on Facebook.",
    ],
    limits: [
      "Facebook does not provide an undo button for unfriending.",
      "Fast repeated friend changes can trigger platform limits, so a long list takes time.",
      "Facebook does not send a dedicated unfriend notification, although someone may notice later.",
    ],
    articles: [
      { slug:"facebook-mass-unfriend-guide", title:"Facebook Mass Unfriend: A Step-by-Step Desktop Guide", description:"Load, filter, review, and remove a large Facebook friends list from one desktop workflow.", primaryKeyword:"facebook mass unfriend", funnel:"Transactional", answer:"Use a complete friends-list view, select the people to remove, and process them at a paced speed that respects Facebook limits.", focus:["Load the full list before deciding who goes.","Use search and mutual-friend filters to narrow the selection.","Pause immediately if Facebook begins limiting actions."] },
      { slug:"bulk-unfriend-facebook-with-control", title:"Bulk Unfriend on Facebook Without Losing Control", description:"Learn which selection, progress, and stopping controls make a bulk Facebook cleanup safer.", primaryKeyword:"bulk unfriend facebook", funnel:"Commercial", answer:"The safest bulk workflow keeps every selected person visible and allows the run to stop before the whole list is processed.", focus:["Avoid blind Select all removal.","Keep a protected list for people who must stay.","Verify the count before confirming."] },
      { slug:"best-facebook-mass-unfriend-extension", title:"Best Facebook Mass Unfriend Extension: What to Look For", description:"Evaluate Facebook friend-removal extensions by list loading, filters, pacing, privacy, and review controls.", primaryKeyword:"facebook mass unfriend extension", funnel:"Commercial", answer:"Choose an extension that loads the complete list, supports selective review, paces removals, and keeps friend data in the browser.", focus:["Complete-list loading matters more than a large speed claim.","Filters reduce accidental removals.","Local processing avoids uploading a private friends list."] },
      { slug:"delete-all-facebook-friends-safely", title:"How to Delete All Facebook Friends: Risks, Limits, and a Safer Plan", description:"Understand the consequences of removing every Facebook friend and use a staged plan instead of a blind wipe.", primaryKeyword:"delete all facebook friends", funnel:"Transactional", answer:"You can remove a full list, but reviewing smaller groups is safer because Facebook provides no bulk undo.", focus:["Export or record important connections first.","Remove obvious unwanted groups before uncertain contacts.","Expect platform pacing on a very large list."] },
      { slug:"delete-multiple-facebook-friends-list", title:"How to Delete Multiple Facebook Friends From One List", description:"Select a specific subset of Facebook friends using search, mutual-friend, and missing-photo filters.", primaryKeyword:"delete multiple facebook friends", funnel:"Transactional", answer:"Load one complete list, filter it to the intended group, and review the selected subset before removal.", focus:["Search by name for known contacts.","Use mutual-friend context before removing unfamiliar people.","Do not treat a missing photo as proof of a fake account."] },
      { slug:"facebook-unfriend-limits", title:"Facebook Unfriend Limits: How Fast Can You Remove Friends?", description:"Learn why there is no universal safe removal speed and how paced unfriending reduces account risk.", primaryKeyword:"how to mass remove friends on facebook", funnel:"Informational", answer:"Facebook does not publish one guaranteed safe mass-unfriend limit, so use paced batches and stop when the account shows restrictions.", focus:["Account age and recent activity can affect limits.","Longer pauses are safer than retrying aggressively.","A slower completed run is better than an account restriction."] },
      { slug:"mass-friends-remover-feature-guide", title:"Mass Friends Remover for Facebook: Full Feature and Privacy Guide", description:"Review list loading, filters, speed tiers, CSV export, local processing, and the limits of automated unfriending.", primaryKeyword:"mass friends remover for facebook", funnel:"Commercial", answer:"Mass Friends Remover adds selection and pacing controls to Facebook's individual unfriend flow while keeping the friends list local.", focus:["Use filters and review before confirmation.","CSV export is useful before a major cleanup.","The extension cannot undo a completed removal."] },
    ],
  },
  {
    promo: "facebook-activity-cleaner",
    category: "Facebook activity",
    productName: "Activity Log Cleaner",
    productHref: "/facebook-activity-cleaner",
    pillarSlug: "delete-all-facebook-posts-at-once",
    workflow: [
      "Open Facebook Activity Log in Chrome and set Facebook to English (US), which the current automation expects.",
      "Use Facebook's own filters to narrow the visible activity to the exact type and period you want to change.",
      "Choose the action, speed, and per-run limit in Activity Log Cleaner, then start with a small batch.",
      "Watch each item as it is handled and pause or stop if the filtered scope is wrong.",
    ],
    limits: [
      "The extension can act only on the items Facebook currently exposes in Activity Log.",
      "Some items go to Facebook trash for about 30 days; other changes may be permanent.",
      "Facebook interface labels and layout changes can temporarily interrupt automation.",
    ],
    articles: [
      { slug:"delete-multiple-facebook-photos-at-once", title:"Delete Multiple Facebook Photos at Once: A Practical Guide", description:"Use Activity Log filters to find photo posts, review the scope, and understand what Facebook sends to trash.", primaryKeyword:"delete multiple facebook photos at once", funnel:"Transactional", answer:"Filter Activity Log to photo activity, test a small selection, and verify whether Facebook moved each item to trash or removed it permanently.", focus:["Photo posts and album contents may appear differently.","Use date filters before running a broad cleanup.","Check Facebook trash after the batch."] },
      { slug:"facebook-activity-log-delete-extension", title:"Facebook Activity Log Delete Extension: What It Can and Cannot Remove", description:"Map Activity Log actions to supported content, language requirements, recovery windows, and platform limits.", primaryKeyword:"facebook activity log delete extension", funnel:"Commercial", answer:"A useful Activity Log extension can handle visible posts, photos, comments, reactions, and tags, but only within Facebook's exposed controls.", focus:["Confirm the supported activity type before starting.","English (US) Facebook labels are currently required.","Deletion, hiding, unliking, and untagging are different outcomes."] },
      { slug:"bulk-delete-facebook-posts-chrome-tool", title:"Bulk Delete Facebook Posts With a Chrome Tool", description:"Compare native one-by-one deletion with a visible, pausable Chrome workflow for Facebook Activity Log.", primaryKeyword:"bulk delete facebook posts tool", funnel:"Commercial", answer:"A Chrome tool can repeat Facebook's own Activity Log actions while showing each item and preserving pause and stop controls.", focus:["Use Facebook filters as the source of truth for scope.","Avoid scripts that run without visible progress.","Test the intended delete or hide action first."] },
      { slug:"bulk-delete-facebook-likes-comments", title:"How to Bulk Delete Facebook Likes and Comments", description:"Clean likes, reactions, and comments through Activity Log without mixing them into a post-deletion run.", primaryKeyword:"how to bulk delete all your likes and comments on facebook", funnel:"Transactional", answer:"Filter Activity Log to likes, reactions, or comments and process each activity type separately so the result remains easy to verify.", focus:["Do not combine unlike, comment deletion, and post deletion blindly.","Use a small per-run limit for the first category.","Check that the visible Facebook menu matches the intended action."] },
      { slug:"mass-delete-facebook-posts-filters", title:"Mass Delete Facebook Posts Using Activity Log Filters", description:"Reduce a Facebook cleanup to a specific date range or activity type before processing posts in bulk.", primaryKeyword:"mass delete facebook posts app", funnel:"Transactional", answer:"The reliable way to narrow a mass deletion is to filter inside Facebook first and let the cleaner act only on that visible scope.", focus:["Filter before the extension starts.","Prefer several understandable batches to one account-wide run.","Record the last completed period if the run pauses."] },
      { slug:"facebook-post-deleter-app-vs-extension", title:"Facebook Post Deleter App vs. Chrome Extension", description:"Compare mobile Activity Log, browser automation, and third-party deletion services by control, privacy, and recoverability.", primaryKeyword:"delete all facebook posts app", funnel:"Commercial", answer:"Use native mobile controls for a few posts and a visible Chrome workflow for a larger reviewed batch; avoid services requiring account credentials.", focus:["Mobile is practical for small cleanups.","Chrome offers a larger review surface and visible progress.","Never give a deletion website your Facebook password or cookies."] },
      { slug:"facebook-trash-after-bulk-deletion", title:"How Facebook Trash Works After Bulk Post Deletion", description:"Understand the roughly 30-day trash window, permanent actions, and checks to make before and after a bulk run.", primaryKeyword:"facebook bulk post delete extension", funnel:"Informational", answer:"Many deleted Facebook posts stay in trash for roughly 30 days, but you should verify each activity type because not every action has the same recovery path.", focus:["Trash, hide from profile, unlike, and untag are not equivalent.","Check trash immediately after the first batch.","Do not rely on the recovery window for every activity type."] },
    ],
  },
  {
    promo: "instagram-dm-cleaner",
    category: "Instagram messages",
    productName: "Instagram DM Cleaner",
    productHref: "/instagram-dm-cleaner",
    pillarSlug: "delete-all-instagram-messages-at-once",
    workflow: [
      "Open the exact Instagram conversation in desktop Chrome and keep it visible.",
      "Open DM Cleaner, scan the conversation, and identify only messages sent by your own account.",
      "Choose all messages, an age range, or a custom date range and confirm a small first batch.",
      "Watch the unsend progress and stop if Instagram begins rate-limiting the session.",
    ],
    limits: [
      "Instagram lets your account unsend only messages that your account sent.",
      "A successfully unsent message is removed for everyone and cannot be restored by the extension.",
      "Large conversations take time because Instagram processes messages individually and may limit repeated actions.",
    ],
    articles: [
      { slug:"instagram-message-delete-extension", title:"Instagram Message Delete Extension: What to Check Before Installing", description:"Evaluate Instagram message tools by ownership limits, date filters, progress controls, and local processing.", primaryKeyword:"delete instagram messages extension", funnel:"Commercial", answer:"Choose a tool that clearly limits itself to your sent messages, keeps the conversation local, and shows the unsend progress.", focus:["The extension cannot unsend the other person's messages.","Date filters matter in a long conversation.","A stop control is essential because unsending is irreversible."] },
      { slug:"unsend-all-instagram-messages-you-sent", title:"How to Unsend All Instagram Messages You Sent", description:"Scan one conversation and remove only the Instagram messages that were sent by your own account.", primaryKeyword:"unsend all instagram messages", funnel:"Transactional", answer:"Open one conversation, scan for messages sent by your account, and unsend the reviewed selection in a paced batch.", focus:["Message ownership determines what Instagram permits.","Unsending removes the message for the conversation participants.","Test a few messages before a large run."] },
      { slug:"bulk-unsend-instagram-conversation", title:"Bulk Unsend Instagram Messages From One Conversation", description:"Use one open Instagram chat, a message scan, and a reviewed selection to handle a conversation in bulk.", primaryKeyword:"bulk unsend instagram messages", funnel:"Transactional", answer:"DM Cleaner works one conversation at a time so the account, chat, date range, and message ownership remain clear.", focus:["Open the exact target conversation first.","Scan before selecting a date range.","Do not switch to another chat during the run."] },
      { slug:"delete-all-instagram-dms-what-gets-removed", title:"Delete All Instagram DMs at Once: What Actually Gets Removed", description:"Separate inbox deletion from unsending and understand what remains for the other participant.", primaryKeyword:"delete all instagram dms at once", funnel:"Informational", answer:"Deleting a chat from your inbox and unsending messages are different actions; bulk unsending can affect only messages your account sent.", focus:["Inbox cleanup may not remove the other participant's copy.","Unsend is message-level and irreversible.","The other person's messages cannot be unsent by your account."] },
      { slug:"unsend-instagram-messages-date-filters", title:"Unsend Instagram Messages at Once With Date Filters", description:"Remove sent Instagram messages older than a chosen age or inside a custom date range.", primaryKeyword:"unsend all instagram messages at once", funnel:"Transactional", answer:"Scan the conversation, select an age or custom date range, and verify the count before unsending the batch.", focus:["Use date filters to protect recent conversation context.","Older-first processing makes the scope easier to verify.","A custom range should be tested on a few messages."] },
      { slug:"mass-unsend-instagram-large-chat", title:"Mass Unsend Instagram Messages Safely in a Large Chat", description:"Handle a long Instagram conversation with careful pacing, automatic slowdown, and a clear stopping point.", primaryKeyword:"mass unsend instagram messages", funnel:"Transactional", answer:"Process a large chat in smaller paced batches and let the tool slow down when Instagram begins limiting actions.", focus:["Large chats require a complete scan before deletion.","Stealth mode can work from older messages forward.","Stop rather than repeatedly retrying a rate-limited action."] },
      { slug:"instagram-dm-cleaner-privacy-limits", title:"Instagram DM Cleaner: Privacy, Limits, and Recovery", description:"Review local processing, account permissions, irreversible unsending, and Instagram rate limits before cleaning a chat.", primaryKeyword:"instagram dm cleaner", funnel:"Commercial", answer:"DM Cleaner processes the open conversation in your existing browser session and does not upload its message content to CleanMySocial.", focus:["The signed-in Instagram session remains the authority.","Only your sent messages can be unsent.","There is no extension-level restore after a successful unsend."] },
    ],
  },
  {
    promo: "reddit-cleaner",
    category: "Reddit",
    productName: "Reddit Cleaner",
    productHref: "/reddit-cleaner",
    pillarSlug: "delete-all-reddit-comments",
    workflow: [
      "Open Reddit in Chrome and connect the side panel to the account whose history you want to review.",
      "Filter by content type, subreddit, age, karma, or keyword and scan before selecting anything.",
      "Review every matching post or comment and protect pinned or awarded items where appropriate.",
      "Optionally overwrite editable text, then confirm a paced deletion run that you can pause or stop.",
    ],
    limits: [
      "Reddit Cleaner can remove only content posted by the signed-in account.",
      "Deletion cannot remove screenshots, quotations, archives, or copies already stored elsewhere.",
      "Reddit rate limits requests, so a very large history must be processed over time.",
    ],
    articles: [
      { slug:"bulk-delete-reddit-posts-comments-history", title:"Bulk Delete Reddit Posts and Comments From Your History", description:"Filter one Reddit history by content type, subreddit, age, karma, or keyword before a reviewed deletion run.", primaryKeyword:"bulk delete reddit posts & comments history", funnel:"Transactional", answer:"Scan the account history, narrow the results with filters, review the matches, and delete only the selected posts and comments.", focus:["Keep posts and comments distinguishable in the review list.","Protect important pinned or awarded content.","Use overwrite before deletion when cached text is a concern."] },
      { slug:"reddit-comment-delete-extension", title:"Reddit Comment Delete Extension: Features That Matter", description:"Compare Reddit deletion tools by scanning, filters, review, overwrite, pacing, and browser-local processing.", primaryKeyword:"bulk delete reddit comments extension", funnel:"Commercial", answer:"Choose a Reddit cleaner that exposes the matching comments before deletion and supports filtering, overwrite, and stopping.", focus:["A preview is more important than a one-click claim.","Overwrite and delete should be separate choices.","The account history should stay in the signed-in browser."] },
      { slug:"bulk-delete-reddit-posts", title:"How to Bulk Delete Reddit Posts", description:"Find your own Reddit posts, protect important items, and process a filtered selection without mixing in comments.", primaryKeyword:"bulk delete reddit posts", funnel:"Transactional", answer:"Filter the scan to posts, review the matching subreddits and dates, and delete a small verified batch before continuing.", focus:["Use content type to exclude comments.","Protect pinned or awarded posts.","Remember that third-party copies may survive deletion."] },
      { slug:"overwrite-reddit-comments-before-deleting", title:"Why Overwrite Reddit Comments Before Deleting Them?", description:"Understand the difference between removing Reddit attribution and replacing editable text before deletion.", primaryKeyword:"remove reddit comments", funnel:"Informational", answer:"Overwriting can reduce the chance that the original text remains in simple caches, but it cannot reach screenshots or independent archives.", focus:["Deletion and overwrite solve different privacy problems.","No method can retract copies already made elsewhere.","Review the replacement text before applying it broadly."] },
      { slug:"mass-delete-reddit-comments-selectively", title:"Mass Delete Reddit Comments Without Removing the Wrong Posts", description:"Use type, subreddit, age, karma, and keyword filters to create a comment-only deletion batch.", primaryKeyword:"mass delete all reddit comments", funnel:"Transactional", answer:"Scan comments separately, narrow the results, and review every match before confirming a mass deletion.", focus:["Content-type filtering prevents post deletion.","Subreddit and keyword filters reduce the batch.","A low first-run limit makes verification easier."] },
      { slug:"delete-multiple-reddit-comments-checklist", title:"Delete Multiple Reddit Comments at Once: Safe Batch Checklist", description:"Prepare, preview, overwrite if needed, and verify a first Reddit comment batch before processing older history.", primaryKeyword:"delete multiple reddit comments at once", funnel:"Transactional", answer:"Start with a narrow filter and a small batch, verify the public result, and then continue with the remaining comments.", focus:["Check which account is signed in.","Save anything you may need before deleting.","Verify the public profile after the batch."] },
      { slug:"reddit-history-cleanup-filters", title:"Reddit History Cleanup: Age, Karma, Subreddit, and Keyword Filters", description:"Choose the right combination of Reddit filters to remove one era or topic instead of wiping everything.", primaryKeyword:"how to delete all reddit posts and comments at once", funnel:"Commercial", answer:"Use age, karma, subreddit, and keyword filters to define a reviewable cleanup scope before deleting posts or comments.", focus:["Age filters isolate an older period.","Subreddit filters isolate a community.","Keyword and karma filters require manual review for context."] },
    ],
  },
  {
    promo: "ig-follower-extractor",
    category: "Instagram followers",
    productName: "Followers Tracker for Instagram",
    productHref: "/instagram-followers-tracker",
    pillarSlug: "export-instagram-followers-to-excel",
    workflow: [
      "Open Instagram in the same Chrome profile and run a fresh follower scan.",
      "Choose your own account or an available public profile and wait for the list to finish loading.",
      "Review followers, following, non-followers, or changes since the previous scan before taking action.",
      "Export the reviewed data or run a paced unfollow selection, then save the dated result.",
    ],
    limits: [
      "Unfollower history begins with the first scan and cannot reconstruct changes from before installation.",
      "Someone who follows and unfollows between two scans may not appear in the change history.",
      "Instagram rate limits can slow scans and automated unfollow actions.",
    ],
    articles: [
      { slug:"manage-instagram-followers-from-computer", title:"How to Manage Instagram Followers From a Computer", description:"Use a desktop scan to compare followers and following, protect accounts, export lists, and pace unfollows.", primaryKeyword:"how to manage instagram followers from computer", funnel:"Commercial", answer:"A desktop follower tool gives you a larger review surface for scanning, filtering, exporting, and selecting accounts before an unfollow.", focus:["Run a fresh scan before making decisions.","Shield accounts that should never be unfollowed.","Save a dated export before a major cleanup."] },
      { slug:"check-who-doesnt-follow-back-instagram", title:"How to Check Who Doesn't Follow You Back on Instagram", description:"Compare followers and following without giving a third-party website your Instagram password.", primaryKeyword:"how to check on instagram who doesn't follow you back", funnel:"Informational", answer:"Compare a fresh followers list with following; the accounts present only in following are the people who do not currently follow back.", focus:["A current comparison is not the same as unfollower history.","The first scan establishes a baseline for future changes.","Review private, verified, and protected accounts before unfollowing."] },
      { slug:"monthly-instagram-follower-audit", title:"Instagram Follower Audit: A Repeatable Monthly Checklist", description:"Turn scans, change history, protected accounts, non-follower review, and exports into a monthly routine.", primaryKeyword:"instagram follower audit", funnel:"Commercial", answer:"Run a dated scan, review changes and non-followers separately, protect important accounts, and save an export each month.", focus:["Use the same scan interval for comparable history.","Separate churn analysis from unfollow decisions.","Store dated exports outside the browser when needed."] },
      { slug:"export-instagram-insights-to-excel", title:"Export Instagram Insights to Excel: What Data You Can Actually Get", description:"Distinguish follower-list exports from Instagram Insights metrics and understand which fields a follower tracker provides.", primaryKeyword:"export instagram insights to excel", funnel:"Informational", answer:"Follower exports contain account-list fields, not the full reach and engagement metrics available in Instagram's professional Insights tools.", focus:["Define whether you need people or performance metrics.","Follower exports can include username, profile URL, and account flags.","Use Instagram's native Insights export for reach and engagement where available."] },
      { slug:"export-public-instagram-followers-excel", title:"Export Public Instagram Follower Data to Excel", description:"Understand public-profile scanning, spreadsheet fields, local processing, and the limits imposed by Instagram.", primaryKeyword:"export instagram public data to excel", funnel:"Transactional", answer:"A public profile can be scanned when Instagram exposes the list, but availability and completeness remain subject to Instagram's access limits.", focus:["Public does not mean unlimited automated access.","Save the source profile and scan date with the export.","Do not treat a snapshot as a permanent follower history."] },
      { slug:"instagram-unfollower-first-scan-baseline", title:"Instagram Unfollower Tracking: Why the First Scan Is Only a Baseline", description:"Learn why follower tools cannot reconstruct past unfollows and how later scans reveal changes over time.", primaryKeyword:"instagram see who isn't following you back", funnel:"Informational", answer:"Instagram does not provide historical unfollower data, so the first scan records a baseline and later scans reveal changes from that point onward.", focus:["No tool can truthfully recover pre-installation unfollows.","Scan regularly enough for the history you need.","Current non-followers and recent unfollowers are different lists."] },
    ],
  },
  {
    promo: "cleanerx",
    category: "X",
    productName: "CleanerX",
    productHref: "/cleanerx",
    pillarSlug: "delete-all-tweets",
    workflow: [
      "Open X in Chrome and connect CleanerX to the account already signed in.",
      "Choose posts, reposts, likes, unfollow, block, or mute and set any age or keyword filters.",
      "Run safe test mode on 10 items and verify the result directly on the X profile.",
      "Continue the paced run, allowing it to pause and resume when X enforces a rate limit.",
    ],
    limits: [
      "X exposes only a limited recent timeline, so very old content may not be reachable through the interface.",
      "Deletion, unlike, unrepost, and unfollow actions are permanent from the extension's perspective.",
      "X account-level and request limits vary, so no fixed daily number is universally safe.",
    ],
    articles: [
      { slug:"mass-delete-tweets-by-date", title:"Mass Delete Tweets by Date Without Wiping Everything", description:"Use age and keyword filters plus a 10-item test to clear one period of an X account.", primaryKeyword:"mass delete tweets by date", funnel:"Transactional", answer:"Filter the reachable timeline by age, run a 10-item test, and verify the profile before deleting the rest of the selected period.", focus:["Download the X archive before a major cleanup.","Date filters depend on what X currently exposes.","Use keyword filters only after reviewing their context."] },
      { slug:"mass-unfollow-twitter-x", title:"How to Mass Unfollow People on Twitter or X", description:"Select the unfollow workflow, test it on a small group, and let it pause safely when X limits actions.", primaryKeyword:"mass unfollow people on twitter", funnel:"Transactional", answer:"Use a paced browser workflow, verify the first accounts removed, and stop when X displays an action restriction.", focus:["Decide the selection rule before starting.","Keep the signed-in account visible.","Do not repeatedly retry during a rate limit."] },
      { slug:"best-twitter-mass-unfollow-extension", title:"Best Twitter Mass Unfollow Extension: What to Look For", description:"Compare X unfollow tools by test mode, progress saving, rate-limit handling, privacy, and account scope.", primaryKeyword:"mass unfollow twitter extension", funnel:"Commercial", answer:"Choose an extension with a small test mode, saved progress, rate-limit backoff, and no requirement to upload account credentials.", focus:["Safe test mode reveals the real selection behavior.","Progress should survive a paused run.","The tool should act only on the visible signed-in account."] },
      { slug:"x-unfollow-daily-limit", title:"How Many Accounts Can You Unfollow on X per Day?", description:"Understand why X has no universally safe published number and how adaptive pacing protects an account.", primaryKeyword:"how many accounts can i unfollow on x per day", funnel:"Informational", answer:"There is no single guaranteed safe daily unfollow number; use small batches and stop as soon as X limits write actions.", focus:["Recent account activity affects practical limits.","Restrictions can affect posting as well as unfollowing.","Adaptive pauses are safer than a fixed aggressive speed."] },
      { slug:"twitter-mass-unfollow-app-vs-extension", title:"Twitter Mass Unfollow App vs. Chrome Extension", description:"Compare mobile tools, scripts, and a browser side panel by visibility, privacy, and rate-limit recovery.", primaryKeyword:"mass unfollow twitter app", funnel:"Commercial", answer:"A browser side panel is easier to verify because the account and progress remain visible, while mobile services often require broader account access.", focus:["Avoid credential-sharing services.","Look for a visible selection and progress log.","Confirm the tool can pause rather than fail the whole run."] },
      { slug:"cleanerx-posts-likes-unfollow-guide", title:"CleanerX Guide: Delete Posts, Remove Likes, and Unfollow in Bulk", description:"Choose the correct CleanerX workflow and understand reachable-history, test-mode, and rate-limit boundaries.", primaryKeyword:"x twitter auto cleaner extension", funnel:"Commercial", answer:"CleanerX separates posts, reposts, likes, unfollow, block, and mute into distinct workflows so each batch remains reviewable.", focus:["Do not mix unlike and post deletion into one decision.","Use age and keyword filters for narrower scopes.","Test 10 items before continuing."] },
    ],
  },
  {
    promo: "cleanfeed",
    category: "Feeds",
    productName: "CleanFeed",
    productHref: "/cleanfeed",
    pillarSlug: "turn-off-youtube-shorts",
    workflow: [
      "Install CleanFeed and open the supported social network in Chrome.",
      "Open the extension and choose the network-specific sections to hide.",
      "Reload the page and verify that messaging, search, profiles, and notifications still work.",
      "Pause hiding temporarily whenever you intentionally want to browse the feed again.",
    ],
    limits: [
      "CleanFeed hides page sections visually; it does not delete or change account data.",
      "The network still delivers the hidden content to the page, so hiding is not a bandwidth or privacy block.",
      "A social-network redesign can temporarily break a visual selector until the extension is updated.",
    ],
    articles: [
      { slug:"show-fewer-youtube-shorts", title:"Show Fewer YouTube Shorts Without Deleting Your Watch History", description:"Compare recommendation feedback with hiding the Shorts shelves and navigation entry in Chrome.", primaryKeyword:"show fewer shorts youtube", funnel:"Informational", answer:"Use YouTube feedback to influence recommendations and a feed-hiding extension when you want the Shorts interface removed immediately.", focus:["Not interested changes recommendations, not the interface.","Hiding Shorts does not delete watch history.","Normal videos, subscriptions, and search can remain available."] },
      { slug:"remove-facebook-news-feed", title:"How to Remove the Facebook News Feed Without Blocking Facebook", description:"Keep Messenger, profiles, notifications, and search while hiding the main Facebook feed.", primaryKeyword:"remove facebook news feed", funnel:"Transactional", answer:"Hide the Facebook feed visually instead of blocking the entire site, so direct communication and intentional navigation continue to work.", focus:["Keep Messenger and notifications accessible.","Hide only the sections that trigger passive scrolling.","Use a temporary pause when the feed is intentionally needed."] },
      { slug:"instagram-hide-reels-stories-suggestions", title:"Instagram Without the Feed: Hide Reels, Stories, and Suggestions", description:"Create a quieter Instagram setup while keeping messages, profiles, notifications, and search available.", primaryKeyword:"instagram without feed", funnel:"Transactional", answer:"Use separate switches for the Instagram feed, Reels, stories, and suggestions instead of disabling the whole site.", focus:["Choose each hidden section independently.","Keep direct messages and profile pages working.","Hiding does not unfollow accounts or change recommendations."] },
      { slug:"remove-x-for-you-tab-browser", title:"How to Remove the For You Tab on X in a Browser", description:"Understand feed hiding, browser support, and the difference between removing a tab and unfollowing accounts.", primaryKeyword:"twitter remove for you tab extension firefox", funnel:"Commercial", answer:"A browser extension can hide the For You interface, but it does not unfollow, mute, or change the accounts behind the recommendations.", focus:["Verify which browser the extension supports.","Keep Following, search, messages, and profiles available.","Use CleanerX instead when the goal is account cleanup rather than visual hiding."] },
      { slug:"feed-blocker-vs-account-cleaner", title:"Social Media Feed Blocker vs. Account Cleaner: Which Do You Need?", description:"Choose between hiding distracting interface sections and permanently removing posts, messages, friends, or follows.", primaryKeyword:"social media cleaner chrome extension", funnel:"Commercial", answer:"Use a feed blocker for reversible visual focus and an account cleaner only when you intend to change or delete account data.", focus:["Feed hiding is reversible and does not change the account.","Account cleanup performs real platform actions.","Choose one job before installing a tool."] },
    ],
  },
];

const orderedSeeds: Array<{ series: Series; seed: ArticleSeed }> = [];
const queues = SERIES.map((series) => ({ series, seeds: [...series.articles] }));
while (orderedSeeds.length < 52) {
  for (const queue of queues) {
    const seed = queue.seeds.shift();
    if (seed) orderedSeeds.push({ series: queue.series, seed });
  }
}

export const SCHEDULED_ARTICLES: EditorialArticle[] = orderedSeeds.map(({ series, seed }, index) => {
  const siblings = series.articles.filter((candidate) => candidate.slug !== seed.slug);
  const ownIndex = series.articles.findIndex((candidate) => candidate.slug === seed.slug);
  const relatedSlugs = [
    siblings[ownIndex % siblings.length]?.slug,
    siblings[(ownIndex + 1) % siblings.length]?.slug,
  ].filter((value): value is string => Boolean(value));

  return {
    slug: seed.slug,
    title: seed.title,
    description: seed.description,
    date: isoDate(index),
    promo: series.promo,
    category: series.category,
    primaryKeyword: seed.primaryKeyword,
    productHref: series.productHref,
    pillarSlug: series.pillarSlug,
    relatedSlugs,
    body: buildBody(seed, series),
  };
});

export const NEW_PILLAR_ARTICLES: EditorialArticle[] = [
  {
    slug: "delete-all-facebook-posts-at-once",
    title: "How to Delete All Facebook Posts at Once",
    description: "Use Facebook Activity Log filters and a visible, pausable Chrome workflow to review and remove old posts in controlled batches.",
    date: "2026-09-09",
    updated: "2026-09-09",
    promo: "facebook-activity-cleaner",
    category: "Facebook activity",
    primaryKeyword: "delete all facebook posts at once",
    productHref: "/facebook-activity-cleaner",
    pillar: true,
    relatedSlugs: ["delete-multiple-facebook-photos-at-once", "bulk-delete-facebook-likes-comments", "facebook-trash-after-bulk-deletion"],
    body: `**Short answer:** Facebook does not provide one universal button that removes every type of post from every part of an account. Use Activity Log to filter the posts Facebook currently exposes, review the scope, and process them in controlled batches.

## Start in Facebook Activity Log

Activity Log is the correct starting point because it shows the account actions Facebook allows you to manage. Open it in desktop Chrome, set Facebook to English (US), and use Facebook's filters before starting any automation. A date or activity-type filter is safer than trying to remove an entire account history blindly.

1. Open your Facebook Activity Log.
2. Choose a date range and the post or photo category you want to review.
3. Confirm that the visible items match the intended cleanup.
4. Start with a small batch and verify the result in Facebook.

[[PROMO]]

## Delete, hide, and trash are different

Facebook can offer different actions for different activity types. A post may be moved to trash for roughly 30 days, hidden from a profile, or removed permanently. A reaction may be unliked, and a tag may be removed without deleting the original post. Read each action as a distinct outcome rather than treating every menu item as “delete.”

## What Activity Log Cleaner adds

Activity Log Cleaner repeats the visible Facebook workflow for the filtered items, scrolls each item into view, and provides speed, run-limit, pause, and stop controls. It cannot reach content Facebook does not display, and interface changes can temporarily interrupt the run.

The extension operates in the signed-in Facebook tab. CleanMySocial does not receive the private Activity Log being processed.

## Continue with a narrower task

Use the related-guide block below as the narrower guides are published. Until then, review Activity Log Cleaner's current capabilities and limits on the [Activity Log Cleaner product page](/facebook-activity-cleaner).

## Bottom line

Filter first, test a small batch, and verify what Facebook did before expanding the run. That approach is slower than a blind wipe and much safer for an account history you cannot fully restore.`,
  },
  {
    slug: "delete-all-instagram-messages-at-once",
    title: "How to Delete All Instagram Messages at Once",
    description: "Understand conversation deletion versus unsending, then remove messages sent by your own Instagram account from a reviewed conversation.",
    date: "2026-09-09",
    updated: "2026-09-09",
    promo: "instagram-dm-cleaner",
    category: "Instagram messages",
    primaryKeyword: "how to delete all instagram messages at once",
    productHref: "/instagram-dm-cleaner",
    pillar: true,
    relatedSlugs: ["unsend-all-instagram-messages-you-sent", "bulk-unsend-instagram-conversation", "instagram-dm-cleaner-privacy-limits"],
    body: `**Short answer:** Instagram separates deleting a conversation from your inbox and unsending individual messages for everyone. A bulk unsend workflow can process messages sent by your own account, but it cannot unsend messages written by the other person.

## Decide which result you need

- **Remove a conversation from your inbox:** this changes your inbox view and should not be described as erasing the other participant's copy.
- **Unsend a message you sent:** Instagram removes that sent message from the conversation for the participants.
- **Remove someone else's message:** your account cannot unsend a message authored by another account.

That ownership rule is the central limitation behind every “delete all Instagram messages” method.

## How a bulk unsend works

1. Open the exact Instagram conversation in desktop Chrome.
2. Open DM Cleaner and scan the conversation.
3. Review the messages the extension identified as sent by your account.
4. Select all, choose an age range, or set a custom date range.
5. Confirm a small first batch and watch the unsend progress.

[[PROMO]]

Instagram processes messages individually and can temporarily limit repeated actions, so a large conversation takes time. DM Cleaner slows down when necessary and lets you stop the run. A successfully unsent message cannot be restored by the extension.

## Privacy and account access

DM Cleaner works through the Instagram session already open in Chrome. The message text, conversation details, cookies, and Instagram account information are not uploaded to CleanMySocial. Avoid any service that asks you to hand over an Instagram password or session token merely to clean a conversation.

## Continue with a narrower task

Use the related-guide block below as the narrower guides are published. Until then, review DM Cleaner's current capabilities and limits on the [Instagram DM Cleaner product page](/instagram-dm-cleaner).

## Bottom line

Instagram does not offer a universal native button that erases every DM from both sides. Use conversation deletion for inbox cleanup and a reviewed, paced unsend workflow for messages sent by your own account.`,
  },
];
