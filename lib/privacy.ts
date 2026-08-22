export interface PermissionNote {
  id: string;
  why: string;
}

export interface ExtPrivacy {
  slug: string;
  name: string;
  storeId: string;
  platform: string;
  summary: string;
  lastUpdated: string;
  localOnly: boolean;
  permissions: PermissionNote[];
  network: PermissionNote[];
  dataAccessed: string[];
  billed: boolean;
  notes?: string[];
}

const UPDATED = "August 4, 2026";

const LICENSE_HOST: PermissionNote = {
  id: "https://www.cleanmysocial.com/*",
  why: "Opens checkout and checks a randomly generated license identifier. No Facebook or Instagram content is sent to the CleanMySocial service.",
};

const FACEBOOK_HOSTS: PermissionNote = {
  id: "facebook.com and messenger.com",
  why: "Lets the extension perform the cleanup actions you request in your own signed-in Messenger tab. Conversation data remains in that tab and is not sent to the developer.",
};

export const PRIVACY: ExtPrivacy[] = [
  {
    slug: "facebook-instagram-cleaner",
    name: "Delete All Messages for Facebook & Instagram",
    storeId: "cboolboidgkagffpalhlojepcghkkfej",
    platform: "Facebook Messenger and Instagram",
    summary:
      "bulk delete, archive, or restore Messenger conversations and scan one Instagram conversation to unsend messages sent by your account.",
    lastUpdated: UPDATED,
    localOnly: true,
    billed: true,
    permissions: [
      {
        id: "storage",
        why: "Stores settings, temporary progress, the local daily action count, review preferences, and license status. The anonymous license key is stored in Chrome sync so it can be restored on another signed-in Chrome browser.",
      },
      {
        id: "webRequest",
        why: "Reads the Instagram request headers needed to make authenticated Instagram requests through your existing session. It does not block or redirect requests, and those headers are not sent to the developer.",
      },
      {
        id: "webNavigation",
        why: "Detects full-page and in-page navigation so the side panel switches to the correct Facebook or Instagram workflow.",
      },
      {
        id: "tabs",
        why: "Identifies the active supported tab, communicates with it, and keeps the side panel synchronized when you switch tabs.",
      },
      {
        id: "cookies",
        why: "Checks whether you are signed in to Instagram and uses your existing Instagram session. Cookies are not modified or sent to the developer.",
      },
      {
        id: "sidePanel",
        why: "Displays cleanup controls, confirmation, progress, daily usage, and license options beside the active tab.",
      },
      {
        id: "scripting",
        why: "Runs a confirmed Instagram unsend request inside the selected Instagram tab.",
      },
    ],
    network: [
      FACEBOOK_HOSTS,
      {
        id: "https://www.instagram.com/*",
        why: "Scans the selected conversation and sends confirmed unsend requests directly to Instagram using your existing session. Instagram data is not sent to the developer or the CleanMySocial website.",
      },
      LICENSE_HOST,
    ],
    dataAccessed: [
      "The visible Messenger conversation list, conversation links, menus, and confirmation dialogs needed to perform the delete, archive, or restore action you start.",
      "For the Instagram conversation selected in the active tab: the thread identifier, participant details, message identifiers, sender status, message type, and timestamps needed to find messages sent by your account and apply date filters.",
      "Instagram sign-in status and the cookies and request headers needed to communicate directly with Instagram. The developer does not receive your password, cookies, authentication headers, or tokens.",
      "The extension does not collect, save, export, or transmit the contents of Facebook or Instagram messages.",
      "Settings, temporary batch progress, review preferences, and the local daily count of successful Facebook deletes or archives and Instagram unsends.",
      "A randomly generated license identifier, sent only to www.cleanmysocial.com to purchase or validate unlimited access. It contains no social-account information.",
    ],
    notes: [
      "Facebook deletes and archives and successful Instagram unsends share a free allowance of 10 actions per local calendar day. Facebook restores and Instagram scans are not metered.",
      "The extension contains no advertising, behavioral analytics, or third-party tracking.",
      "Actions run only after you choose the operation. Permanent Facebook deletion and Instagram unsending require confirmation and may not be recoverable.",
      "Facebook operations pause while their tab is hidden. Instagram operates only on the selected conversation in the active workflow.",
    ],
  },
  {
    slug: "facebook-messenger-cleaner",
    name: "Messenger Cleaner – Delete All Facebook Messages",
    storeId: "imobgpikmofiapbnijmebknbkmkncdkl",
    platform: "Facebook Messenger",
    summary:
      "delete, archive, or restore Facebook Messenger conversations in bulk from a persistent side panel.",
    lastUpdated: UPDATED,
    localOnly: true,
    billed: true,
    permissions: [
      {
        id: "storage",
        why: "Stores settings, temporary progress, the local daily delete/archive count, review preferences, and license status. The anonymous license key may be stored in Chrome sync.",
      },
      {
        id: "tabs",
        why: "Identifies the active Messenger tab, communicates with the cleanup script, and keeps the panel synchronized when you switch tabs.",
      },
      {
        id: "sidePanel",
        why: "Displays the delete, archive, restore, progress, and license controls beside Messenger.",
      },
      {
        id: "webNavigation",
        why: "Detects Messenger navigation, including in-page navigation, so the side panel stays connected to the correct page.",
      },
    ],
    network: [FACEBOOK_HOSTS, LICENSE_HOST],
    dataAccessed: [
      "The visible Messenger conversation list, conversation links, menus, and confirmation dialogs required to perform the action you request. This information is processed temporarily in the supported tab.",
      "Settings, temporary operation progress, review preferences, and the local count of successful deletes and archives for the current calendar day.",
      "A randomly generated license identifier used to buy or validate unlimited access. It contains no Facebook account information.",
      "The extension does not collect or transmit message contents, passwords, cookies, conversation lists, or Facebook account credentials.",
    ],
    notes: [
      "The free plan includes 10 successful deletes or archives per local calendar day. Restore actions are not metered.",
      "Operations pause while the Messenger tab is hidden and resume when it becomes visible.",
      "Permanent deletion requires explicit confirmation and cannot be undone through the extension.",
      "The extension contains no advertising, behavioral analytics, or third-party tracking.",
    ],
  },
  {
    slug: "mass-unfriender",
    name: "Mass Friends Remover for Facebook — Bulk Unfriender",
    storeId: "fegkbiinmaoipoonnlhekdoefgebmdnj",
    platform: "Facebook",
    summary: "select and remove multiple friends from your own Facebook account.",
    lastUpdated: UPDATED,
    localOnly: true,
    billed: true,
    permissions: [
      {
        id: "tabs",
        why: "Finds or opens a Facebook tab when you invoke the extension, focuses that tab, and opens checkout or the Chrome Web Store review page only when you choose those actions.",
      },
      {
        id: "storage",
        why: "Stores a randomly generated license key and validation cache, plus whether you already opened the review page. The anonymous license key is stored in Chrome sync so it can be restored on another signed-in Chrome browser.",
      },
    ],
    network: [
      {
        id: "https://www.facebook.com/* and https://web.facebook.com/*",
        why: "Reads your visible friends list and sends only the unfriend requests you confirm directly to Facebook through your existing signed-in session. Facebook data is not sent to the developer.",
      },
      LICENSE_HOST,
    ],
    dataAccessed: [
      "Your visible Facebook friends list, processed locally so you can select whom to remove. The list and the names of removed friends are not collected, stored, or sent to the developer.",
      "A randomly generated license identifier used to buy, validate, or restore access. It contains no Facebook account information.",
      "A local preference recording whether you opened the Chrome Web Store review page, used only to avoid repeatedly showing the same review request.",
    ],
    notes: [
      "The extension runs only when you open it on your Facebook friends-list page and initiate the removal workflow.",
      "The free experience may limit the size of a large removal batch. A paid CleanMySocial license removes that product limit.",
      "Unfriending changes your Facebook account and may not be reversible without sending a new friend request.",
      "The extension contains no advertising, behavioral analytics, or third-party tracking.",
    ],
  },
  {
    slug: "instagram-dm-cleaner",
    name: "DM Cleaner — Bulk Delete Instagram Messages",
    storeId: "aekeomcopkngciopbjbdmlmpgfdcndmm",
    platform: "Instagram",
    summary: "scan one Instagram conversation and bulk-unsend messages sent by your own account.",
    lastUpdated: "August 17, 2026",
    localOnly: true,
    billed: true,
    permissions: [
      { id: "storage", why: "Stores temporary cleanup progress, the daily successful-unsend count, review preferences, and a validation cache. The anonymous license key is stored in Chrome sync so it can follow you to another signed-in Chrome browser." },
      { id: "webRequest", why: "Reads the Instagram request headers required to make authenticated requests through your existing session. It does not block or redirect traffic, and the headers are never sent to CleanMySocial." },
      { id: "webNavigation", why: "Detects Instagram in-page navigation so the side panel stays synchronized with the open conversation." },
      { id: "tabs", why: "Finds the active Instagram tab, opens the product page when you choose to purchase, and keeps the side panel synchronized." },
      { id: "cookies", why: "Checks Instagram sign-in status and uses your existing session. Cookies are not modified or sent to CleanMySocial." },
      { id: "sidePanel", why: "Displays conversation controls, filters, confirmations, cleanup progress, inline review and allowance notices, and license options beside Instagram." },
      { id: "scripting", why: "Runs each confirmed unsend request inside the selected Instagram tab." },
    ],
    network: [
      { id: "https://www.instagram.com/*", why: "Scans the selected conversation and sends confirmed unsend requests directly to Instagram. Instagram data is not sent to CleanMySocial." },
      {
        id: "https://cleanmysocial.com/*",
        why: "Opens the DM Cleaner product page, validates a randomly generated license identifier, and sends privacy-filtered technical crash reports. No Instagram content, credentials, cookies, request headers, profile details, or license key is included in crash reports.",
      },
    ],
    dataAccessed: [
      "For the selected conversation: thread and message identifiers, sender status, message type, participant display details, and timestamps needed to identify your sent messages and apply date filters. This stays in the extension workflow.",
      "Instagram sign-in status and the cookies and request headers needed to communicate directly with Instagram. CleanMySocial does not receive them.",
      "Temporary cleanup progress, the successful-unsend count for the current local calendar day, and review preferences stored locally in Chrome.",
      "A randomly generated license identifier sent to CleanMySocial only to purchase, validate, or restore access. It contains no Instagram account information.",
      "The extension does not collect, save, export, or transmit Instagram message content, usernames, profile names, cookies, tokens, or request headers.",
    ],
    notes: [
      "The free allowance is 50 successful unsends per local calendar day. If you choose to open the Chrome Web Store review page, the allowance increases to 100. Scanning does not use the allowance.",
      "Lifetime access is a one-time purchase processed by Creem. The product has no recurring subscription.",
      "Automatic crash reports contain only the extension version, workflow source, stable error details, locale, and platform; they exclude Instagram and license data.",
      "Unsend is permanent and applies only to messages sent by your own account.",
      "The extension contains no advertising or behavioral analytics.",
    ],
  },
  {
    slug: "instagram-followers-tracker",
    name: "Followers Tracker for Instagram – Unfollowers & Bulk Unfollow",
    storeId: "kfaklckklmlknieiniakbekofgndfpbp",
    platform: "Instagram",
    summary:
      "see who does not follow you back, who unfollowed you, and who your fans are, export those lists, and unfollow accounts one by one or in bulk from your own account.",
    lastUpdated: "August 6, 2026",
    localOnly: true,
    billed: true,
    permissions: [
      {
        id: "cookies",
        why: "Reads your existing Instagram csrftoken and ds_user_id cookies so requests to Instagram are authenticated as you and so the signed-in account can be detected. Cookies are not modified and are never sent to the developer.",
      },
      {
        id: "storage",
        why: "Stores your preferences, anonymous license key and access cache, looked-up and shielded accounts, a 24-hour scan cache, and the follower roster and change log used to detect unfollowers.",
      },
      { id: "alarms", why: "Schedules opt-in Pro follower scans approximately once per day while Chrome is available." },
      { id: "notifications", why: "Shows an opt-in Pro desktop alert when a completed automatic scan detects lost followers." },
    ],
    network: [
      {
        id: "https://www.instagram.com/* and https://i.instagram.com/*",
        why: "Reads profile information and the followers/following lists, and sends the unfollow requests you confirm, directly to Instagram through your existing session. No other server receives this data.",
      },
      {
        id: "https://*.cdninstagram.com/* and https://*.fbcdn.net/*",
        why: "Loads profile pictures for the accounts shown in the table, straight from Instagram's own image servers.",
      },
      LICENSE_HOST,
    ],
    dataAccessed: [
      "Public profile fields for the account you scan — user id, username, display name, verified status, private status, profile picture URL, and follower/following counts — used to build and display the lists.",
      "The followers and following lists of the account you look up, exactly as Instagram would show them to your signed-in session. They are stored locally so the extension can diff scans and tell you who unfollowed you.",
      "A locally built follower-change history (gained and lost followers with timestamps, capped at 5,000 entries per account). Instagram provides no such history; the extension derives it from your own scans and keeps it on your device.",
      "Instagram sign-in status and the cookies and headers needed to talk to Instagram. The developer never receives your password, cookies, or tokens.",
      "Your settings, looked-up accounts, shielded accounts, and scan cache. Uninstalling the extension or clearing its storage removes all of it.",
    ],
    notes: [
      "Manual scans, complete results, filters, history, and one-by-one unfollowing are free. Pro unlocks bulk unfollow, CSV and Excel exports, and opt-in automatic daily monitoring.",
      "Read-only lists work on any account whose lists you can already see — public accounts, or private ones you follow. Unfollowing is only ever possible on the account you are signed in as.",
      "Pro CSV and Excel exports are generated in your browser and saved directly to your computer. Nothing is uploaded to produce them.",
      "Scanning and unfollowing are paced deliberately and back off on Instagram rate limits. Bulk runs need the tab to stay open and can be stopped at any time.",
      "Follower-change tracking starts at your first scan and can only see changes between your own scans; an unfollow and refollow between two scans is invisible.",
    ],
  },
  {
    slug: "reddit-cleaner",
    name: "Reddit Cleaner – Bulk Delete Posts, Comments & History",
    storeId: "ghddfkljkcojgpdngeaglannonehpldh",
    platform: "Reddit",
    summary:
      "scan, filter, review, optionally overwrite, and bulk-delete posts and comments from your own Reddit account.",
    lastUpdated: "August 18, 2026",
    localOnly: true,
    billed: false,
    permissions: [
      {
        id: "storage",
        why: "Stores your filter and speed settings, a cached profile summary, the most recent run totals, review-prompt state, and a random installation identifier used only for technical crash reporting. Scan results and post or comment text are not written to storage.",
      },
      {
        id: "sidePanel",
        why: "Displays the profile, filters, review list, confirmation, progress, pause or stop controls, and results beside Reddit.",
      },
    ],
    network: [
      {
        id: "https://old.reddit.com/*",
        why: "Reads your profile and your own post and comment history, then sends only the overwrite and delete requests you confirm directly to Reddit through your existing signed-in session. Reddit content is not sent to CleanMySocial.",
      },
      {
        id: "https://cleanmysocial.com/api/crash",
        why: "Receives automatic technical crash reports so the developer can diagnose unexpected failures. Reports contain extension and runtime identifiers, a random installation identifier, version, error details, locale, platform, time, and duplicate count. They are designed to exclude Reddit content, usernames, account identifiers, cookies, and authentication values.",
      },
    ],
    dataAccessed: [
      "Your Reddit username and profile summary, including account age, avatar URL, karma totals, moderator or premium status, verified-email status, and the authentication value Reddit requires for requests. The profile summary is cached locally in Chrome so the side panel can display it; it is not sent to CleanMySocial.",
      "For your own posts and comments: Reddit item identifier, type, subreddit, score, creation time, title or text, permalink, award status, pinned status, and whether the item can be edited. These fields are processed in memory to apply your filters and build the review list. Post and comment text and scan results are not saved to disk or uploaded to CleanMySocial.",
      "Your cleanup choices, including content type, age, subreddit list, karma threshold, keyword, protected-item options, overwrite choice, speed, and optional item limit. These settings are stored locally in Chrome until you change them, clear extension data, or uninstall the extension.",
      "The outcome and aggregate totals from the most recent deletion run, plus whether the optional Chrome Web Store review prompt has been handled. These local records do not contain post or comment content.",
      "A random installation identifier and technical error details may be sent to CleanMySocial when an unexpected failure occurs. The service hashes the installation identifier before storage and retains crash events for a limited operational period (90 days by default). This is error reporting, not behavioral analytics.",
      "The extension uses your existing Reddit session to communicate directly with Reddit. It does not ask for, collect, or send your Reddit password, cookies, or authentication values to CleanMySocial.",
    ],
    notes: [
      "Reddit Cleaner has no separate account, paid plan, advertising, behavioral analytics, or third-party tracking.",
      "A scan starts only when you request it. Every matching item is shown for review before deletion, and destructive cleanup requires confirmation.",
      "If overwrite is enabled, editable text is first replaced with “[removed by Reddit Cleaner]” and then the item is deleted. Both requests go directly to Reddit.",
      "Scan results and deletion progress live in extension memory and may disappear when Chrome unloads the extension worker. Only the aggregate most-recent-run totals are stored locally.",
      "Deletion is permanent and cannot be undone through the extension. Reddit independently controls its own processing, retention, backups, and third-party access to content previously published on Reddit.",
      "Reddit Cleaner is not affiliated with or endorsed by Reddit, Inc.",
    ],
  },
  {
    slug: "cleanerx",
    name: "CleanerX — Free X (Twitter) Bulk Cleaner",
    storeId: "efkdbehpkfaiehogkiokbiecjdbiebgi",
    platform: "X (formerly Twitter)",
    summary:
      "bulk delete your posts and reposts, remove likes, unfollow accounts, and block or mute a list of accounts through your own signed-in X session.",
    lastUpdated: "August 17, 2026",
    localOnly: true,
    billed: false,
    permissions: [
      {
        id: "scripting",
        why: "Runs the X requests you initiate inside an open x.com or twitter.com tab, where X accepts requests from your existing signed-in session. It may also read your displayed account name and avatar for the connection card. Nothing is injected until you connect or start an action.",
      },
      {
        id: "tabs",
        why: "Finds or opens an X tab to relay requested actions, confirms that the relay tab remains on X, and opens X archive settings, the Chrome Web Store review page, or CleanMySocial only when you choose those links. Other tabs are not inspected.",
      },
      {
        id: "storage",
        why: "Stores your workflow and filter choices, cached X profile card, current job, queue, progress, per-item outcomes, lifetime action count, review-prompt state, discovered X query identifiers, and a random crash-report installation identifier. A short-lived session record suppresses duplicate crash reports.",
      },
      {
        id: "unlimitedStorage",
        why: "Allows a large cleanup queue and its minimal result log to survive side-panel closure, service-worker suspension, browser restarts, and X rate-limit pauses without exceeding Chrome's normal local-storage quota.",
      },
      {
        id: "cookies",
        why: "Reads the ct0 CSRF cookie and the numeric account id from the twid cookie so X can authenticate the actions you request and CleanerX can target the signed-in account. No cookie is modified or sent to CleanMySocial.",
      },
      {
        id: "alarms",
        why: "Wakes a long-running cleanup after Chrome suspends the service worker and resumes work when an X rate-limit waiting period ends.",
      },
      {
        id: "notifications",
        why: "Notifies you when a background cleanup finishes or pauses because X requires your attention. It does not send promotional notifications.",
      },
      {
        id: "sidePanel",
        why: "Displays account connection, backup guidance, cleanup filters, confirmations, progress, pause or stop controls, block and mute tools, and locally stored results beside X.",
      },
    ],
    network: [
      {
        id: "https://x.com/* and https://twitter.com/*",
        why: "Reads your own profile and supported timelines and sends the delete, undo-repost, unlike, unfollow, block, or mute actions you request directly to X through your existing session.",
      },
      {
        id: "https://api.x.com/*",
        why: "Reads the signed-in account's screen name so the panel can clearly identify which account will be cleaned.",
      },
      {
        id: "https://abs.twimg.com/*",
        why: "Downloads X's public web bundle as text to discover current GraphQL operation identifiers when X changes them. The downloaded bundle is searched, not executed by CleanerX.",
      },
      {
        id: "https://pbs.twimg.com/*",
        why: "Loads the profile image returned by X for the connected-account card.",
      },
      {
        id: "https://www.cleanmysocial.com/api/crash",
        why: "Receives automatic technical crash reports containing the extension and runtime identifiers, random install-only UUID, version, error details, locale, platform, time, and duplicate count. Reports are designed to exclude X account data, post content, handles, cookies, CSRF values, and session tokens.",
      },
    ],
    dataAccessed: [
      "Your signed-in X account's numeric id, handle, display name, profile image URL, and available post, following, and follower counts, used to identify the account in the side panel. The profile card is cached locally in Chrome.",
      "Identifiers, types, timestamps, and text for supported posts, reposts, and likes returned by X. Text and timestamps are processed to apply your keyword and age filters; the cleanup queue retains matching item identifiers rather than post text.",
      "The account identifiers in your following list when you choose mass unfollow, and the usernames you paste when you choose block or mute. Active-job inputs and minimal outcomes may remain in local extension storage until cleared or replaced.",
      "The ct0 CSRF value and numeric account id from the twid cookie, plus X's normal authenticated request headers. These are used only for requests sent directly to X and are not included in CleanMySocial crash reports.",
      "Your local workflow state and choices, including selected category, keywords, age filter, safe-test setting, backup-step choice, queued item ids, progress cursors, action outcomes, timestamps, totals, rate-limit state, and review-prompt preferences.",
      "A random installation UUID and technical crash details sent to CleanMySocial when the extension encounters a caught or uncaught error. This is operational error reporting, not behavioral analytics.",
      "CleanerX does not read or upload the X archive you request from X. The archive link opens X's own settings, and any archive file stays on your computer.",
    ],
    notes: [
      "CleanerX is free and unlimited. It has no CleanerX account, license key, payment flow, subscription, advertising, or behavioral analytics.",
      "X normally exposes only a limited recent timeline through these interfaces, so CleanerX may not be able to reach older content. X also applies rate limits and account-level caps; the extension backs off, saves progress, and can resume later.",
      "Safe test mode stops after 10 matching items so you can inspect the result before starting a larger run.",
      "Deleting or undoing account activity can be permanent. CleanerX asks for confirmation before destructive cleanup and lets you pause or stop a run.",
      "The Chrome Web Store review page opens only when you choose the review action after a completed-action milestone.",
      "CleanerX is not affiliated with or endorsed by X Corp.",
    ],
  },
  {
    slug: "facebook-activity-cleaner",
    name: "Delete All Facebook Posts & Photos — Activity Log Cleaner",
    storeId: "iaimbgcccpmmdgpmkkcaiilgdeobgmcl",
    platform: "Facebook",
    summary:
      "bulk delete, hide, or remove your own Facebook posts, photos, comments, likes, reactions, and tags from the Activity Log.",
    lastUpdated: "August 16, 2026",
    localOnly: true,
    billed: false,
    permissions: [
      {
        id: "sidePanel",
        why: "Displays the entire interface — action choice, speed, per-run limit, progress, and the pause and stop buttons — beside your Facebook tab while the cleanup runs.",
      },
      {
        id: "storage",
        why: "Stores your chosen action, speed, and limit, the progress of the current run so the panel can be reopened without losing your place, a running total of completed actions, and whether the review prompt was dismissed. Local storage only; nothing is written to Chrome sync.",
      },
      {
        id: "tabs",
        why: "Reads the active tab's address to confirm you are on facebook.com and on the Activity Log before enabling the controls, opens the Activity Log or Facebook's language settings when you click those buttons, and sends the start, pause, and stop messages to that specific tab.",
      },
    ],
    network: [
      {
        id: "https://www.facebook.com/* and https://facebook.com/*",
        why: "The only site the extension runs on. It reads the Activity Log page in your own signed-in tab to find each item's action menu and clicks the delete, hide, unlike, or remove-tag option Facebook already provides. Facebook performs every deletion; nothing from the page is sent to the developer or to CleanMySocial.",
      },
    ],
    dataAccessed: [
      "The visible Activity Log rows in your open tab — the three-dot action menus, the options inside them, and Facebook's confirmation dialogs — read only to find and click the control for the action you chose. This is processed in the tab and never leaves it.",
      "A short snippet of each row's text, held in memory during a run so the same item is not acted on twice while Facebook re-renders the list. It is discarded when the run ends and is never written to storage or transmitted.",
      "Whether the page is displayed in English, so the extension can tell you to switch Facebook to English (US) before it starts. Only a true or false value is stored.",
      "Your settings and the progress of the current run, plus a count of how many actions have been completed and your review-prompt preference. These are numbers and settings, not content.",
      "The extension does not collect, store, export, or transmit the text of your posts, your photos or videos, your comments, your messages, your friends list, your password, your cookies, or any Facebook account credentials.",
    ],
    notes: [
      "The extension is free. There is no account, no sign-in, no license key, and no usage limit, so it never contacts a CleanMySocial server.",
      "Facebook must be set to English (US) while the extension runs, because it matches Facebook's English button labels. The panel detects this and links you to the setting.",
      "Every item is scrolled to the centre of the screen before it is touched, so you can see exactly what is being acted on. You can pause or stop at any moment.",
      "The extension never reloads or closes your tab, and it acts only on the items Facebook is currently showing — use Facebook's own filters to control the scope.",
      "Items sent to Facebook's trash remain there for about 30 days and can be restored from Facebook. Other removals may be permanent.",
      "There is no advertising, no behavioural analytics, and no third-party tracking of any kind.",
      "The Chrome Web Store review page opens only if you choose to leave a review. Uninstalling the extension removes everything it stored.",
    ],
  },
  {
    slug: "cleanfeed",
    name: "CleanFeed — Hide Social Media Feeds",
    storeId: "efebojaacbocpjiiimmjnjpnhlihmjee",
    platform: "Facebook, Instagram, YouTube, Reddit, X, and LinkedIn",
    summary:
      "hide the news feed and other distracting sections — Shorts, Reels, stories, suggestions, sponsored posts — on six social networks, with a switch for each one.",
    lastUpdated: "August 21, 2026",
    localOnly: true,
    billed: false,
    permissions: [
      {
        id: "storage",
        why: "Stores which networks and sections you have switched on, any pause you have set, whether quotes are shown, and a random installation identifier used only for technical crash reporting. Local storage only; nothing is written to Chrome sync.",
      },
      {
        id: "alarms",
        why: "Restores hiding automatically when a pause you chose — 5 minutes, an hour, the rest of the day — runs out, and keeps the toolbar badge accurate.",
      },
    ],
    network: [
      {
        id: "facebook.com, web.facebook.com, instagram.com, youtube.com, reddit.com, old.reddit.com, x.com, and linkedin.com",
        why: "The extension applies a stylesheet to the pages you open on these sites so the sections you chose are hidden. It reads nothing from them, sends no requests to them, and transmits nothing from those pages to CleanMySocial. It never signs in, and it never changes, deletes, or posts anything on your account.",
      },
      {
        id: "https://www.cleanmysocial.com/api/crash",
        why: "Receives automatic technical crash reports and breakage notices when a network changes its page structure and CleanFeed can no longer find the feed it is supposed to hide. Reports contain the extension and runtime identifiers, a random installation identifier, version, error details, the internal network and section name (for example \u201creddit/feed\u201d), locale, platform, time, and duplicate count. They are designed to exclude page addresses, page content, post text, profile details, cookies, and authentication values.",
      },
    ],
    dataAccessed: [
      "Your choices: which of the six networks are on, which sections are hidden on each, whether quotes appear, and any pause you set. These are settings and timestamps, stored locally in Chrome, not content.",
      "Whether specific page elements exist. To hide a feed, the extension checks the page for the elements described in its own list of selectors. It reads their presence \u2014 not their contents \u2014 and never copies, stores, or transmits posts, comments, messages, profile details, friend or follower lists, or images.",
      "When a check fails repeatedly, CleanFeed reports that its selectors no longer match, so the pattern can be fixed. That report names only its own network and section identifiers and how many of its sections matched. It carries no page address and no page content.",
      "A random installation identifier and technical error details may be sent to CleanMySocial when the extension fails unexpectedly. The service hashes the installation identifier before storage and retains crash events for a limited operational period (90 days by default). This is error reporting, not behavioral analytics.",
      "The extension does not ask for, collect, or transmit your password, cookies, session tokens, or account identifiers for any social network. It has no account of its own and never signs in on your behalf.",
      "The quotes shown where a feed has been hidden ship inside the extension. Displaying one contacts no server.",
    ],
    notes: [
      "CleanFeed is free and unlimited. There is no CleanFeed account, license key, payment flow, subscription, advertising, or behavioral analytics.",
      "The extension only hides. It uses a stylesheet, so nothing is deleted, posted, unfollowed, or otherwise changed on any social network, and everything reappears the moment you switch a section off or pause the extension.",
      "All six networks start switched on, with the section defaults the extension ships. You can turn any network, or any individual section, off at any time from the toolbar popup or from the panel shown in place of a hidden feed.",
      "The power button pauses everything for 5 minutes up to the rest of the day, or until you switch it back on. While paused, no page is touched at all.",
      "Breakage notices are throttled to one per network section per extension version per week, so a site redesign produces a handful of reports rather than one per page you open.",
      "The extension requires Chrome 105 or newer, because older versions cannot interpret the selectors it relies on.",
      "CleanFeed is not affiliated with or endorsed by Meta, Google, Reddit, X Corp., or LinkedIn.",
    ],
  },
];

const PRIVACY_ALIASES: Record<string, string> = {
  "messenger-cleaner": "facebook-instagram-cleaner",
  "mass-friends-remover": "mass-unfriender",
  "followers-tracker": "instagram-followers-tracker",
  "ig-followers-tracker": "instagram-followers-tracker",
  "instagram-cleaner": "instagram-dm-cleaner",
};

export const PRIVACY_STATIC_SLUGS = [
  ...PRIVACY.map((policy) => policy.slug),
  ...Object.keys(PRIVACY_ALIASES),
];

export function getPrivacy(slug: string): ExtPrivacy | undefined {
  const canonicalSlug = PRIVACY_ALIASES[slug] || slug;
  return PRIVACY.find((policy) => policy.slug === canonicalSlug);
}
