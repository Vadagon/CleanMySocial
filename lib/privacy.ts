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

const PURCHASED_LICENSE_HOST: PermissionNote = {
  id: "https://cleanmysocial.com/* and https://www.cleanmysocial.com/*",
  why: "Opens the product and lifecycle pages, validates a purchased license key that the customer chooses to paste, and sends privacy-filtered breakage or crash reports. Facebook content is never sent.",
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
      "bulk delete, archive, or restore Messenger conversations, and scan one Messenger or Instagram conversation to unsend messages sent by your account.",
    lastUpdated: "September 14, 2026",
    localOnly: true,
    billed: true,
    permissions: [
      {
        id: "storage",
        why: "Stores settings, temporary progress, daily and lifetime successful-action counts, whether you clicked the review card, the entitlement cache, the installation identifier, and the short queue of milestone and error reports waiting to be sent. Chrome sync contains a purchased license key only after the customer pastes it and the server validates it.",
      },
      { id: "alarms", why: "Wakes the extension about a minute after a milestone or error report is queued so the batch is still delivered if Chrome stopped the background worker in the meantime." },
      {
        id: "webRequest",
        why: "Reads the Instagram request headers needed to make authenticated Instagram requests through your existing session. It does not block or redirect requests, and those headers are not sent to CleanMySocial.",
      },
      {
        id: "webNavigation",
        why: "Detects full-page and in-page navigation so the side panel switches to the correct Facebook or Instagram workflow.",
      },
      {
        id: "tabs",
        why: "Identifies the active supported tab, keeps the side panel synchronized when you switch tabs, and opens Facebook, Instagram, the product page, or the Chrome Web Store review page only when you choose those actions.",
      },
      {
        id: "cookies",
        why: "Checks whether you are signed in to Facebook or Instagram and uses your existing session. Cookies are not modified or sent to CleanMySocial.",
      },
      {
        id: "sidePanel",
        why: "Displays cleanup controls, confirmations, progress, review and allowance notices, and license options beside the active tab.",
      },
      {
        id: "scripting",
        why: "Runs the scan and unsend steps you start inside your own Facebook or Instagram tab, including reading Facebook's local message store there instead of scraping the page.",
      },
      {
        id: "declarativeNetRequest",
        why: "Sets the user-agent header only on the extension's own Instagram direct-message requests so Instagram accepts them; it does not alter your tab's traffic.",
      },
      { id: "offscreen", why: "Turns a conversation backup you request into a file. The offscreen page makes no network requests." },
      { id: "downloads", why: "Saves a conversation backup you request to your computer. The file is written locally and never uploaded." },
    ],
    network: [
      FACEBOOK_HOSTS,
      {
        id: "https://*.instagram.com/*",
        why: "Scans the selected conversation and sends confirmed unsend requests directly to Instagram using your existing session. Instagram data is not sent to CleanMySocial.",
      },
      {
        id: "https://cleanmysocial.com/*",
        why: "Opens the product, installed, and uninstall pages; lets the CleanMySocial installed page ask the extension to open its side panel; validates a purchased license key only when you paste it and click Unlock; and sends closed-code breakage reports. No Facebook or Instagram content, identifiers, cookies, tokens, or request headers are sent.",
      },
      {
        id: "https://cleanmysocial.com/api/telemetry",
        why: "Receives two kinds of anonymous report in one batched request, roughly a minute after they occur: the product milestones described under “Data the extension accesses”, and privacy-filtered technical error reports (error type, stable code, extension version, workflow source, locale, platform, time, and a repeat count). Neither contains message content, conversation names, Facebook or Instagram identifiers, cookies, tokens, page addresses, or your license key.",
      },
    ],
    dataAccessed: [
      "The visible Messenger conversation list, conversation links, menus, and confirmation dialogs required to delete, archive, or restore the conversations you choose. This is processed temporarily in the supported tab.",
      "For a Messenger or Instagram conversation you scan: message identifiers, sender status, message type, participant display details, and timestamps needed to find your own messages and apply date filters. This stays in the extension workflow.",
      "Facebook and Instagram sign-in status and the cookies and Instagram request headers needed to communicate directly with those services. CleanMySocial does not receive them.",
      "Only if you choose Save backup (Pro): the text, timestamps, participant display names, and media links of the whole conversation, written into an HTML file saved to your computer. The backup is built inside the browser and is never sent to CleanMySocial.",
      "A purchased license key only when you paste it for validation. The extension never generates a licensing identity and makes no license request when the key slot is empty, when Chrome starts, or when the panel opens.",
      "Settings, temporary operation progress, daily and lifetime successful-action totals, cached entitlement state, and whether you clicked the Chrome Web Store review card.",
      "A random installation identifier, created on install and stored only in this browser. It is sent with the milestone and error reports described in this notice so repeated deliveries are not counted twice and so one installation reporting an error fifty times is not mistaken for fifty affected users. CleanMySocial hashes it before storing it, and it is never used for licensing, never synced between devices, never sent with a license check, and never attached to conversation data.",
      "Six anonymous product milestones, each recorded at most once per installation: that the extension was installed, that a first cleanup action was started, that a first cleanup action succeeded, that the free daily allowance was reached, that you opened the Pro page from inside the extension, and that you opened the Chrome Web Store review page. Each is a name and a timestamp — no message data, no counts of what you removed, and no record of a review being written.",
      "When you uninstall the extension, Chrome opens the CleanMySocial uninstall page and any milestones that had not yet been sent travel in that page address, along with the installation identifier and, if one is pending, the code of the most recent error. Chrome gives a removed extension no way to run code, so this is the only way a last report survives removal. It carries names and timestamps only.",
    ],
    notes: [
      "Free cleanup begins at Fast Speed, continues at Standard Speed, and stops after the documented daily allowance of successful actions shared by Facebook and Instagram. Scanning is not metered. Pro unlocks unlimited actions, Super Speed, and conversation backups.",
      "Operations pause while the Messenger tab is hidden and resume when it becomes visible.",
      "Permanent deletion and unsending require explicit confirmation and cannot be undone through the extension.",
      "Known platform breakage reports contain only the extension slug, closed failure code, version, and locale. Error reports exclude message content, Facebook and Instagram identifiers, cookies, tokens, and license keys.",
      "Milestone and error reports are retained for a limited operational period — 90 days by default — and are read only in aggregate.",
      "The extension contains no advertising and no third-party tracking, and it does not profile you. It does report the six anonymous product milestones described above to CleanMySocial, which is first-party product analytics; nothing it sends identifies you, your accounts, or your conversations.",
    ],
  },
  {
    slug: "facebook-messenger-cleaner",
    name: "Messenger Cleaner – Delete All Facebook Messages",
    storeId: "imobgpikmofiapbnijmebknbkmkncdkl",
    platform: "Facebook Messenger",
    summary:
      "delete, archive, or restore Facebook Messenger conversations in bulk, and unsend your own messages in one conversation, from a persistent side panel.",
    lastUpdated: "September 14, 2026",
    localOnly: true,
    billed: true,
    permissions: [
      {
        id: "storage",
        why: "Stores settings, temporary progress, daily and lifetime successful-action counts, whether you clicked the review card, the entitlement cache, the installation identifier, and the short queue of milestone and error reports waiting to be sent. Chrome sync contains a purchased license key only after the customer pastes it and the server validates it.",
      },
      { id: "alarms", why: "Wakes the extension about a minute after a milestone or error report is queued so the batch is still delivered if Chrome stopped the background worker in the meantime." },
      { id: "tabs", why: "Identifies the active Messenger tab, keeps the panel synchronized when you switch tabs, and opens Messenger, the product page, or the Chrome Web Store review page only when you choose those actions." },
      { id: "sidePanel", why: "Displays the delete, archive, restore, unsend, progress, review and allowance notices, and license controls beside Messenger." },
      { id: "webNavigation", why: "Detects Messenger navigation, including in-page navigation, so the side panel stays connected to the correct page." },
      { id: "scripting", why: "Runs the scan and unsend steps you start inside your own Messenger tab, reading Facebook's local message store there instead of scraping the page." },
      { id: "cookies", why: "Reads the Facebook c_user cookie to confirm which account is signed in. Cookies are not modified or sent to CleanMySocial." },
      { id: "offscreen", why: "Turns a conversation backup you request into a file. The offscreen page makes no network requests." },
      { id: "downloads", why: "Saves a conversation backup you request to your computer. The file is written locally and never uploaded." },
    ],
    network: [
      {
        id: "facebook.com and messenger.com",
        why: "Lets the extension perform the cleanup actions you request in your own signed-in Messenger tab. Conversation data remains in that tab and is not sent to CleanMySocial.",
      },
      {
        id: "https://cleanmysocial.com/*",
        why: "Opens the product, installed, and uninstall pages; lets the CleanMySocial installed page ask the extension to open its side panel; validates a purchased license key only when you paste it and click Unlock; and sends closed-code breakage reports. No Facebook content, identifiers, cookies, or tokens are sent.",
      },
      {
        id: "https://cleanmysocial.com/api/telemetry",
        why: "Receives two kinds of anonymous report in one batched request, roughly a minute after they occur: the product milestones described under “Data the extension accesses”, and privacy-filtered technical error reports (error type, stable code, extension version, workflow source, locale, platform, time, and a repeat count). Neither contains message content, conversation names, Facebook identifiers, cookies, tokens, page addresses, or your license key.",
      },
    ],
    dataAccessed: [
      "The visible Messenger conversation list, conversation links, menus, and confirmation dialogs required to delete, archive, or restore the conversations you choose. This is processed temporarily in the supported tab.",
      "For a conversation you scan to unsend: message identifiers, sender status, and timestamps from Facebook's local message store, used to find your own messages and apply date filters. This stays in the extension workflow.",
      "Only if you choose Save backup (Pro): the text, timestamps, participant display names, and Facebook media links of the whole conversation, written into an HTML file saved to your computer. The backup is built inside the browser and is never sent to CleanMySocial.",
      "A purchased license key only when you paste it for validation. The extension never generates a licensing identity and makes no license request when the key slot is empty, when Chrome starts, or when the panel opens.",
      "Settings, temporary operation progress, daily and lifetime successful-action totals, cached entitlement state, and whether you clicked the Chrome Web Store review card.",
      "A random installation identifier, created on install and stored only in this browser. It is sent with the milestone and error reports described in this notice so repeated deliveries are not counted twice and so one installation reporting an error fifty times is not mistaken for fifty affected users. CleanMySocial hashes it before storing it, and it is never used for licensing, never synced between devices, never sent with a license check, and never attached to conversation data.",
      "Six anonymous product milestones, each recorded at most once per installation: that the extension was installed, that a first cleanup action was started, that a first cleanup action succeeded, that the free daily allowance was reached, that you opened the Pro page from inside the extension, and that you opened the Chrome Web Store review page. Each is a name and a timestamp — no message data, no counts of what you removed, and no record of a review being written.",
      "When you uninstall the extension, Chrome opens the CleanMySocial uninstall page and any milestones that had not yet been sent travel in that page address, along with the installation identifier and, if one is pending, the code of the most recent error. Chrome gives a removed extension no way to run code, so this is the only way a last report survives removal. It carries names and timestamps only.",
    ],
    notes: [
      "Free cleanup begins at Fast Speed, continues at Standard Speed, and stops after the documented daily allowance of successful deletes, archives, restores, and unsends. Scanning is not metered. Pro unlocks unlimited actions, Super Speed, and conversation backups.",
      "Operations pause while the Messenger tab is hidden and resume when it becomes visible.",
      "Permanent deletion and unsending require explicit confirmation and cannot be undone through the extension.",
      "Known Facebook breakage reports contain only the extension slug, closed failure code, version, and locale. Error reports exclude message content, Facebook identifiers, cookies, tokens, and license keys.",
      "Milestone and error reports are retained for a limited operational period — 90 days by default — and are read only in aggregate.",
      "The extension contains no advertising and no third-party tracking, and it does not profile you. It does report the six anonymous product milestones described above to CleanMySocial, which is first-party product analytics; nothing it sends identifies you, your Facebook account, or your conversations.",
    ],
  },
  {
    slug: "mass-unfriender",
    name: "Mass Friends Remover for Facebook — Bulk Unfriender",
    storeId: "fegkbiinmaoipoonnlhekdoefgebmdnj",
    platform: "Facebook",
    summary: "select and remove multiple friends from your own Facebook account.",
    lastUpdated: "September 12, 2026",
    localOnly: true,
    billed: true,
    permissions: [
      {
        id: "tabs",
        why: "Finds or opens a Facebook tab when you invoke the extension, focuses that tab, and opens checkout or the Chrome Web Store review page only when you choose those actions.",
      },
      {
        id: "storage",
        why: "Stores the locally cached friends list, selected speed, daily successful-removal count, review preference, entitlement cache, the installation identifier, and the short queue of milestone and error reports waiting to be sent. Chrome sync contains a purchased license key only after the customer pastes it and the server validates it.",
      },
      { id: "sidePanel", why: "Displays friend selection, confirmation, progress, speed, license, and recovery controls beside Facebook." },
      { id: "cookies", why: "Checks the existing Facebook sign-in session. Cookies are not modified or sent to CleanMySocial." },
      { id: "scripting", why: "Reads a Facebook session token from an already-open Facebook tab when needed. The token stays inside the extension workflow." },
      { id: "declarativeNetRequest", why: "Sets Facebook Origin and Referer headers only on the extension's own Facebook GraphQL requests so Facebook accepts them; it does not alter the user's tab traffic." },
    ],
    network: [
      {
        id: "https://www.facebook.com/* and https://web.facebook.com/*",
        why: "Reads your visible friends list and sends only the unfriend requests you confirm directly to Facebook through your existing signed-in session. Facebook data is not sent to the developer.",
      },
      PURCHASED_LICENSE_HOST,
      {
        id: "https://www.cleanmysocial.com/api/telemetry",
        why: "Receives two kinds of anonymous report in one batched request, roughly a minute after they occur: the product milestones described under “Data the extension accesses”, and privacy-filtered technical error reports (error type, stable code, extension version, workflow source, locale, platform, time, and a repeat count). Neither contains friend names or profiles, Facebook identifiers, cookies, tokens, page addresses, or your license key.",
      },
    ],
    dataAccessed: [
      "Your visible Facebook friends list, processed locally so you can select whom to remove. The list and the names of removed friends are not collected, stored, or sent to the developer.",
      "A purchased license key only when you paste it for validation. The extension never generates a licensing identity and makes no license request when the key slot is empty.",
      "Daily and lifetime successful-removal totals, selected speed, cached entitlement state, and whether you clicked the Chrome Web Store review button.",
      "A random installation identifier, created on install and stored only in this browser. It is sent with the milestone and error reports described in this notice so repeated deliveries are not counted twice and so one installation reporting an error fifty times is not mistaken for fifty affected users. CleanMySocial hashes it before storing it, and it is never used for licensing, never synced between devices, never sent with a license check, and never attached to friend data.",
      "Six anonymous product milestones, each recorded at most once per installation: that the extension was installed, that a first removal was started, that a first removal succeeded, that the free daily allowance was reached, that you opened the Pro page from inside the extension, and that you opened the Chrome Web Store review page. Each is a name and a timestamp — no friend data, no counts of who you removed, and no record of a review being written. This is product analytics: it tells the developer where people get stuck, not what you did on Facebook.",
      "When you uninstall the extension, Chrome opens the CleanMySocial uninstall page and any milestones that had not yet been sent travel in that page address, along with the installation identifier and, if one is pending, the code of the most recent error. Chrome gives a removed extension no way to run code, so this is the only way a last report survives removal. It carries names and timestamps only.",
    ],
    notes: [
      "The extension runs only when you open it on your Facebook friends-list page and initiate the removal workflow.",
      "Free cleanup begins at Fast Speed, continues at Standard Speed, and stops after the documented daily allowance. Pro unlocks unlimited removals and Super Speed.",
      "Known Facebook breakage reports contain only the extension slug, closed failure code, version, and locale. Crash reports exclude friend data, Facebook identifiers, cookies, tokens, and license keys.",
      "Milestone and error reports are retained for a limited operational period — 90 days by default — and are read only in aggregate, to see how many installations reach each step and how widely a fault is spreading.",
      "Unfriending changes your Facebook account and may not be reversible without sending a new friend request.",
      "The extension contains no advertising and no third-party tracking, and it does not profile you. It does report the six anonymous product milestones described above to CleanMySocial, which is first-party product analytics; nothing it sends identifies you, your Facebook account, or the people you removed.",
    ],
  },
  {
    slug: "instagram-dm-cleaner",
    name: "DM Cleaner — Bulk Delete Instagram Messages",
    storeId: "aekeomcopkngciopbjbdmlmpgfdcndmm",
    platform: "Instagram",
    summary: "scan one Instagram conversation and bulk-unsend messages sent by your own account.",
    lastUpdated: "September 13, 2026",
    localOnly: true,
    billed: true,
    permissions: [
      {
        id: "storage",
        why: "Stores temporary cleanup progress, the selected speed, daily and lifetime successful-unsend counts, whether you clicked the review card, the entitlement cache, the installation identifier, and the short queue of milestone and error reports waiting to be sent. Chrome sync contains a purchased license key only after the customer pastes it and the server validates it.",
      },
      { id: "alarms", why: "Wakes the extension about a minute after a milestone or error report is queued so the batch is still delivered if Chrome stopped the background worker in the meantime." },
      { id: "webRequest", why: "Reads the Instagram request headers required to make authenticated requests through your existing session. It does not block or redirect traffic, and the headers are never sent to CleanMySocial." },
      { id: "webNavigation", why: "Detects Instagram in-page navigation so the side panel stays synchronized with the open conversation." },
      { id: "tabs", why: "Finds the active Instagram tab, keeps the side panel synchronized, and opens the product page or the Chrome Web Store review page only when you choose those actions." },
      { id: "cookies", why: "Checks Instagram sign-in status and uses your existing session. Cookies are not modified or sent to CleanMySocial." },
      { id: "sidePanel", why: "Displays conversation controls, filters, confirmations, cleanup progress, review and allowance notices, and license options beside Instagram." },
      { id: "scripting", why: "Runs each confirmed unsend request inside the selected Instagram tab." },
      { id: "declarativeNetRequest", why: "Sets the user-agent header only on the extension's own Instagram direct-message requests so Instagram accepts them; it does not alter your tab's traffic." },
      { id: "offscreen", why: "Turns a conversation backup you request into a file. The offscreen page makes no network requests." },
      { id: "downloads", why: "Saves a conversation backup you request to your computer. The file is written locally and never uploaded." },
    ],
    network: [
      { id: "https://*.instagram.com/*", why: "Scans the selected conversation and sends confirmed unsend requests directly to Instagram. Instagram data is not sent to CleanMySocial." },
      {
        id: "https://cleanmysocial.com/*",
        why: "Opens the product, installed, and uninstall pages; lets the CleanMySocial installed page ask the extension to open its side panel; validates a purchased license key only when you paste it and click Unlock; and sends closed-code breakage reports. No Instagram content, identifiers, cookies, tokens, or request headers are sent.",
      },
      {
        id: "https://cleanmysocial.com/api/telemetry",
        why: "Receives two kinds of anonymous report in one batched request, roughly a minute after they occur: the product milestones described under “Data the extension accesses”, and privacy-filtered technical error reports (error type, stable code, extension version, workflow source, locale, platform, time, and a repeat count). Neither contains message content, usernames, Instagram identifiers, cookies, tokens, page addresses, or your license key.",
      },
    ],
    dataAccessed: [
      "For the selected conversation: thread and message identifiers, sender status, message type, participant display details, and timestamps needed to identify your sent messages and apply date filters. This stays in the extension workflow.",
      "Instagram sign-in status and the cookies and request headers needed to communicate directly with Instagram. CleanMySocial does not receive them.",
      "Only if you choose Save backup (Pro): the text, timestamps, participant display names, and Instagram media links of the whole conversation, written into an HTML file saved to your computer. The backup is built inside the browser and is never sent to CleanMySocial.",
      "A purchased license key only when you paste it for validation. The extension never generates a licensing identity and makes no license request when the key slot is empty, when Chrome starts, or when the panel opens.",
      "Daily and lifetime successful-unsend totals, selected speed, cached entitlement state, and whether you clicked the Chrome Web Store review card.",
      "A random installation identifier, created on install and stored only in this browser. It is sent with the milestone and error reports described in this notice so repeated deliveries are not counted twice and so one installation reporting an error fifty times is not mistaken for fifty affected users. CleanMySocial hashes it before storing it, and it is never used for licensing, never synced between devices, never sent with a license check, and never attached to conversation data.",
      "Six anonymous product milestones, each recorded at most once per installation: that the extension was installed, that a first unsend was started, that a first unsend succeeded, that the free daily allowance was reached, that you opened the Pro page from inside the extension, and that you opened the Chrome Web Store review page. Each is a name and a timestamp — no message data, no counts of what you removed, and no record of a review being written.",
      "When you uninstall the extension, Chrome opens the CleanMySocial uninstall page and any milestones that had not yet been sent travel in that page address, along with the installation identifier and, if one is pending, the code of the most recent error. Chrome gives a removed extension no way to run code, so this is the only way a last report survives removal. It carries names and timestamps only.",
    ],
    notes: [
      "Free cleanup begins at Fast Speed, continues at Standard Speed, and stops after the documented daily allowance of successful unsends. Scanning does not use the allowance. Pro unlocks unlimited unsends, Super Speed, and conversation backups.",
      "Known Instagram breakage reports contain only the extension slug, closed failure code, version, and locale. Error reports exclude message content, Instagram identifiers, cookies, tokens, and license keys.",
      "Milestone and error reports are retained for a limited operational period — 90 days by default — and are read only in aggregate.",
      "Unsend is permanent and applies only to messages sent by your own account.",
      "The extension contains no advertising and no third-party tracking, and it does not profile you. It does report the six anonymous product milestones described above to CleanMySocial, which is first-party product analytics; nothing it sends identifies you, your Instagram account, or your conversations.",
    ],
  },
  {
    slug: "instagram-followers-tracker",
    name: "Followers Tracker for Instagram – Unfollowers & Bulk Unfollow",
    storeId: "kfaklckklmlknieiniakbekofgndfpbp",
    platform: "Instagram",
    summary:
      "see who does not follow you back, who unfollowed you, and who your fans are, export those lists, and unfollow accounts one by one or in bulk from your own account.",
    lastUpdated: "August 24, 2026",
    localOnly: true,
    billed: true,
    permissions: [
      {
        id: "cookies",
        why: "Reads your existing Instagram csrftoken and ds_user_id cookies so requests to Instagram are authenticated as you and so the signed-in account can be detected. Cookies are not modified and are never sent to the developer.",
      },
      {
        id: "storage",
        why: "Stores your preferences, a customer-pasted license key and access cache, free daily usage, looked-up and shielded accounts, a 24-hour scan cache, the follower roster and change log, and a crash-only installation identifier used for technical reliability reports.",
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
      "Manual scans, complete results, filters, history, one-by-one unfollowing, and 30 automated unfollows per local day are free. Pro unlocks unlimited Super Speed, CSV and Excel exports, and opt-in automatic daily monitoring.",
      "Read-only lists work on any account whose lists you can already see — public accounts, or private ones you follow. Unfollowing is only ever possible on the account you are signed in as.",
      "Pro CSV and Excel exports are generated in your browser and saved directly to your computer. Nothing is uploaded to produce them.",
      "Automatic crash reports contain only extension/version and stable technical failure details, locale, platform, timestamp, and a crash-only identifier. They exclude Instagram account data, follower lists, cookies, request variables, and license keys.",
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
    lastUpdated: "September 14, 2026",
    localOnly: true,
    billed: false,
    permissions: [
      {
        id: "storage",
        why: "Stores your filter and speed settings, a cached profile summary, the most recent run totals, your lifetime count of successful deletions, whether you clicked the Chrome Web Store review card, a random installation identifier, and anonymous milestone and error reports waiting to be sent. Scan results and post or comment text are not written to storage.",
      },
      {
        id: "alarms",
        why: "Wakes the extension about a minute after a milestone or error report is queued so the report is still delivered if Chrome has stopped the background worker.",
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
        id: "https://cleanmysocial.com/*",
        why: "Opens the installed and uninstall pages and lets the CleanMySocial installed page ask the extension to open its side panel. No Reddit content, usernames, cookies, or authentication values are sent.",
      },
      {
        id: "https://cleanmysocial.com/api/telemetry",
        why: "Receives two kinds of anonymous report in one batched request, roughly a minute after they occur: the product milestones described under “Data the extension accesses”, and privacy-filtered technical error reports (error type, stable code, extension version, workflow source, locale, platform, browser version, time, and a repeat count). Neither contains Reddit content, usernames, account identifiers, cookies, authentication values, or page addresses.",
      },
    ],
    dataAccessed: [
      "Your Reddit username and profile summary, including account age, avatar URL, karma totals, moderator or premium status, verified-email status, and the authentication value Reddit requires for requests. The profile summary is cached locally in Chrome so the side panel can display it; it is not sent to CleanMySocial.",
      "For your own posts and comments: Reddit item identifier, type, subreddit, score, creation time, title or text, permalink, award status, pinned status, and whether the item can be edited. These fields are processed in memory to apply your filters and build the review list. Post and comment text and scan results are not saved to disk or uploaded to CleanMySocial.",
      "Your cleanup choices, including content type, age, subreddit list, karma threshold, keyword, protected-item options, overwrite choice, speed, and optional item limit. These settings are stored locally in Chrome until you change them, clear extension data, or uninstall the extension.",
      "The outcome and aggregate totals from the most recent deletion run, your lifetime count of successful deletions, and whether you clicked the Chrome Web Store review card. These local records do not contain post or comment content.",
      "A random installation identifier, created on install and stored only in this browser. It is sent with the milestone and error reports described in this notice so repeated deliveries are not counted twice. CleanMySocial hashes it before storing it, and it is never synced between devices or attached to Reddit data.",
      "Four anonymous product milestones, each recorded at most once per installation: that the extension was installed, that a first deletion was started, that a first deletion succeeded, and that you opened the Chrome Web Store review page. Each is a name and a timestamp — no Reddit data, no counts of what you deleted, and no record of a review being written.",
      "Technical error details when an unexpected failure occurs, sent in the same anonymous batch. Signed-out sessions, stopped runs, offline states, and Reddit rate-limit pauses are not reported.",
      "When you uninstall the extension, Chrome opens the CleanMySocial uninstall page and any milestones that had not yet been sent travel in that page address, along with the installation identifier and, if one is pending, the code of the most recent error. Chrome gives a removed extension no way to run code, so this is the only way a last report survives removal. It carries names and timestamps only.",
      "The extension uses your existing Reddit session to communicate directly with Reddit. It does not ask for, collect, or send your Reddit password, cookies, or authentication values to CleanMySocial.",
    ],
    notes: [
      "Reddit Cleaner has no separate account, paid plan, advertising, or third-party tracking, and it does not profile you. It does report the four anonymous product milestones described above to CleanMySocial, which is first-party product analytics; nothing it sends identifies you, your Reddit account, or your content.",
      "Milestone and error reports are retained for a limited operational period — 90 days by default — and are read only in aggregate.",
      "A scan starts only when you request it. Every matching item is shown for review before deletion, and destructive cleanup requires confirmation.",
      "If overwrite is enabled, editable text is first replaced with “[removed by Reddit Cleaner]” and then the item is deleted. Both requests go directly to Reddit.",
      "Scan results and deletion progress live in extension memory and may disappear when Chrome unloads the extension worker. Only the aggregate most-recent-run totals are stored locally.",
      "Deletion is permanent and cannot be undone through the extension. Reddit independently controls its own processing, retention, backups, and third-party access to content previously published on Reddit.",
      "Reddit Cleaner is not affiliated with or endorsed by Reddit, Inc.",
    ],
  },
  {
    slug: "cleanerx",
    name: "CleanerX — X (Twitter) Bulk Cleaner",
    storeId: "efkdbehpkfaiehogkiokbiecjdbiebgi",
    platform: "X (formerly Twitter)",
    summary:
      "bulk delete your posts and reposts, remove likes, unfollow accounts, and block or mute a list of accounts through your own signed-in X session.",
    lastUpdated: "September 14, 2026",
    localOnly: false,
    billed: true,
    permissions: [
      {
        id: "scripting",
        why: "Runs the X requests you initiate inside an open x.com or twitter.com tab, where X accepts requests from your existing signed-in session. It may also read your displayed account name and avatar for the connection card. Nothing is injected until you connect or start an action.",
      },
      {
        id: "tabs",
        why: "Finds or opens an X tab to relay requested actions and confirms that the relay tab remains on X. Opens the CleanMySocial installed page once after a fresh install, and opens X archive settings, the Chrome Web Store review page, the Pro page, or CleanMySocial only when you choose those links. Other tabs are not inspected.",
      },
      {
        id: "storage",
        why: "Stores your workflow and filter choices, cached X profile card, current job, queue, progress, per-item outcomes, lifetime action count, daily successful-action count, whether you clicked the review card, the entitlement cache, discovered X query identifiers, the installation identifier, and the short queue of milestone and error reports waiting to be sent. A short-lived session record suppresses duplicate error reports. Chrome sync contains a purchased license key only after you paste it and the server validates it.",
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
        why: "Wakes a long-running cleanup after Chrome suspends the service worker, resumes work when an X rate-limit waiting period ends, and wakes the extension about a minute after a milestone or error report is queued so the batch is still delivered if Chrome stopped the background worker in the meantime.",
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
        id: "https://cleanmysocial.com/*",
        why: "Opens the product, installed, and uninstall pages, and lets the CleanMySocial installed page ask the extension to open its side panel. That exchange carries only a protocol name and a yes/no answer — no X data, license key, or page content.",
      },
      {
        id: "https://cleanmysocial.com/api/telemetry",
        why: "Receives two kinds of anonymous report in one batched request, roughly a minute after they occur: the product milestones described under “Data the extension accesses”, and privacy-filtered technical error reports (error type, stable code, extension version, workflow source, locale, platform, browser version, time, and a repeat count). Neither contains post text, handles, X account identifiers, cookies, CSRF values, session tokens, page addresses, or your license key.",
      },
      {
        id: "https://cleanmysocial.com/api/license",
        why: "Validates a license key only when you paste it and click Activate. The request contains only the key and public product slug, never your X account, posts, handles, cookies, or session values. Rejected keys are not stored, and no license request is made when Chrome starts or the panel opens.",
      },
      {
        id: "https://cleanmysocial.com/api/report",
        why: "Sends a closed, non-identifying failure code when CleanerX detects that X changed a supported API workflow. It contains the product slug, extension version, and locale—no account or post data.",
      },
    ],
    dataAccessed: [
      "Your signed-in X account's numeric id, handle, display name, profile image URL, and available post, following, and follower counts, used to identify the account in the side panel. The profile card is cached locally in Chrome.",
      "Identifiers, types, timestamps, and text for supported posts, reposts, and likes returned by X. Text and timestamps are processed to apply your keyword and age filters; the cleanup queue retains matching item identifiers rather than post text.",
      "The account identifiers in your following list when you choose mass unfollow, and the usernames you paste when you choose block or mute. Active-job inputs and minimal outcomes may remain in local extension storage until cleared or replaced.",
      "The ct0 CSRF value and numeric account id from the twid cookie, plus X's normal authenticated request headers. These are used only for requests sent directly to X and are never included in reports to CleanMySocial.",
      "Your local workflow state and choices, including selected category, keywords, age filter, safe-test setting, backup-step choice, queued item ids, progress cursors, action outcomes, timestamps, totals, rate-limit state, and review-prompt preferences.",
      "A validated purchased license key stored in Chrome sync, the local daily action count, and the entitlement result CleanMySocial returned when you clicked Activate. That result is checked locally and lapses one hour after the license's expiry; the extension never re-checks it in the background. An empty key slot means free access and makes no license request.",
      "A random installation identifier, created on install and stored only in this browser. It is sent with the milestone and error reports described in this notice so repeated deliveries are not counted twice and so one installation reporting an error fifty times is not mistaken for fifty affected users. CleanMySocial hashes it before storing it, and it is never used for licensing, never synced between devices, never sent with a license check, and never attached to X data.",
      "Six anonymous product milestones, each recorded at most once per installation: that the extension was installed, that a first cleanup action was started, that a first cleanup action succeeded, that the free daily allowance was reached, that you opened the Pro page from inside the extension, and that you opened the Chrome Web Store review page. Each is a name and a timestamp — no X data, no counts of what you removed, and no record of a review being written.",
      "When you uninstall the extension, Chrome opens the CleanMySocial uninstall page and any milestones that had not yet been sent travel in that page address, along with the installation identifier and, if one is pending, the code of the most recent error. Chrome gives a removed extension no way to run code, so this is the only way a last report survives removal. It carries names and timestamps only.",
      "CleanerX does not read or upload the X archive you request from X. The archive link opens X's own settings, and any archive file stays on your computer.",
    ],
    notes: [
      "CleanerX is free to use with a local daily action allowance. Optional monthly or lifetime Pro access adds unlimited actions and Super Speed. No CleanMySocial account or X-account sign-in is sent to CleanMySocial.",
      "X normally exposes only a limited recent timeline through these interfaces, so CleanerX may not be able to reach older content. X also applies rate limits and account-level caps; the extension backs off, saves progress, and can resume later.",
      "Safe test mode stops after 10 matching items so you can inspect the result before starting a larger run.",
      "Deleting or undoing account activity can be permanent. CleanerX asks for confirmation before destructive cleanup and lets you pause or stop a run.",
      "The Chrome Web Store review page opens only when you click the review card or a review prompt. A click records only that the page was opened, never that a review was written.",
      "Known X breakage reports contain only the extension slug, closed failure code, version, and locale. Milestone and error reports are retained for a limited operational period — 90 days by default — and are read only in aggregate.",
      "The extension contains no advertising and no third-party tracking, and it does not profile you. It does report the six anonymous product milestones described above to CleanMySocial, which is first-party product analytics; nothing it sends identifies you, your X account, or your posts.",
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
    lastUpdated: "September 14, 2026",
    localOnly: false,
    billed: true,
    permissions: [
      {
        id: "sidePanel",
        why: "Displays the entire interface — action choice, speed, per-run limit, progress, and the pause and stop buttons — beside your Facebook tab while the cleanup runs.",
      },
      {
        id: "storage",
        why: "Stores your chosen action, speed, and limit, current-run progress, confirmed-action totals, the local daily allowance, whether you clicked the review card, cached entitlement status, the installation identifier, and the short queue of milestone and error reports waiting to be sent. A license key is written to Chrome sync only after CleanMySocial validates it, so the same purchased key is available to the suite on your synced Chrome devices.",
      },
      { id: "alarms", why: "Wakes the extension about a minute after a milestone or error report is queued so the batch is still delivered if Chrome stopped the background worker in the meantime." },
      {
        id: "tabs",
        why: "Reads the active tab's address to confirm you are on facebook.com and on the Activity Log before enabling the controls, opens the Activity Log, Facebook's language settings, the product page, or the Chrome Web Store review page when you click those buttons, and sends the start, pause, and stop messages to that specific tab.",
      },
    ],
    network: [
      {
        id: "https://www.facebook.com/* and https://facebook.com/*",
        why: "The only site the extension runs on. It reads the Activity Log page in your own signed-in tab to find each item's action menu and clicks the delete, hide, unlike, or remove-tag option Facebook already provides. Facebook performs every deletion; nothing from the page is sent to the developer or to CleanMySocial.",
      },
      {
        id: "https://cleanmysocial.com/*",
        why: "Opens the product, installed, and uninstall pages; lets the CleanMySocial installed page ask the extension to open its side panel; validates a purchased license key only when you paste it and click Activate; and sends closed-code breakage reports. The license request contains only the key and the public product slug. No Facebook content, identifiers, cookies, or credentials are sent.",
      },
      {
        id: "https://cleanmysocial.com/api/telemetry",
        why: "Receives two kinds of anonymous report in one batched request, roughly a minute after they occur: the product milestones described under “Data the extension accesses”, and privacy-filtered technical error reports (error type, stable code, extension version, workflow source, locale, platform, time, and a repeat count). Neither contains Activity Log row text, Facebook identifiers, cookies, page addresses, or your license key.",
      },
    ],
    dataAccessed: [
      "The visible Activity Log rows in your open tab — the three-dot action menus, the options inside them, and Facebook's confirmation dialogs — read only to find and click the control for the action you chose. This is processed in the tab and never leaves it.",
      "A short snippet of each row's text, held in memory during a run so the same item is not acted on twice while Facebook re-renders the list. It is discarded when the run ends and is never written to storage or transmitted.",
      "Whether the page is displayed in English, so the extension can tell you to switch Facebook to English (US) before it starts. Only a true or false value is stored.",
      "Your settings and current-run progress, confirmed-action totals, local daily allowance, cached entitlement result, and review preference. These are numbers and settings, not Facebook content.",
      "A purchased license key only when you paste it for validation, stored in Chrome sync after CleanMySocial confirms it. The extension makes no license request when the key slot is empty, when Chrome starts, or when the panel opens; a confirmed result is kept locally until shortly after its expiry. A rejected pasted key is never stored, and a network failure is not treated as an invalid key.",
      "A random installation identifier, created on install and stored only in this browser. It is sent with the milestone and error reports described in this notice so repeated deliveries are not counted twice. CleanMySocial hashes it before storing it, and it is never used for licensing, never synced between devices, and never sent with a license check.",
      "Six anonymous product milestones, each recorded at most once per installation: that the extension was installed, that a first cleanup action was started, that a first cleanup action succeeded, that the free daily allowance was reached, that you opened the Pro page from inside the extension, and that you opened the Chrome Web Store review page. Each is a name and a timestamp — no Activity Log data, no counts of what you removed, and no record of a review being written.",
      "When you uninstall the extension, Chrome opens the CleanMySocial uninstall page and any milestones that had not yet been sent travel in that page address, along with the installation identifier and, if one is pending, the code of the most recent error. Chrome gives a removed extension no way to run code, so this is the only way a last report survives removal. It carries names and timestamps only.",
      "The extension does not collect, store, export, or transmit the text of your posts, your photos or videos, your comments, your messages, your friends list, your password, your cookies, or any Facebook account credentials.",
    ],
    notes: [
      "The extension is free to use with a local daily action allowance. Optional monthly or lifetime Pro access adds unlimited actions and Super Speed; no CleanMySocial account or social-account sign-in is required.",
      "Facebook must be set to English (US) while the extension runs, because it matches Facebook's English button labels. The panel detects this and links you to the setting.",
      "Every item is scrolled to the centre of the screen before it is touched, so you can see exactly what is being acted on. You can pause or stop at any moment.",
      "The extension never reloads or closes your tab, and it acts only on the items Facebook is currently showing — use Facebook's own filters to control the scope.",
      "Items sent to Facebook's trash remain there for about 30 days and can be restored from Facebook. Other removals may be permanent.",
      "There is no advertising or third-party tracking, and the extension does not profile you. Besides license checks you start and breakage and error reports, it sends CleanMySocial only the six anonymous product milestones described above; nothing it sends identifies you or your Facebook account.",
      "Milestone and error reports are retained for a limited operational period — 90 days by default — and are read only in aggregate.",
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
  {
    slug: "gmail-cleaner",
    name: "Gmail Cleaner – Bulk Delete Emails & Mass Unsubscribe – CleanMyInbox",
    storeId: "hconkejfhepopjpgmpdflaindmlcpkng",
    platform: "Gmail (Google)",
    summary:
      "scan for mailing lists, unsubscribe from chosen senders, and bulk-delete their emails from a Chrome side panel using your own signed-in Google account.",
    lastUpdated: "September 14, 2026",
    localOnly: false,
    billed: true,
    permissions: [
      {
        id: "identity",
        why: "Opens Google's own sign-in and consent screen so Gmail Cleaner can read and clean the mailbox through your existing session. The token Google issues is held by Chrome and is never stored by the extension or sent to CleanMySocial.",
      },
      {
        id: "storage",
        why: "Stores the scanned mailing-list summary, your block list view, delete filters, today's deletion and unsubscribe counts, scan progress, review-prompt state, a validated purchased license key in Chrome sync, and a random crash-report installation identifier. No email content is stored.",
      },
      {
        id: "sidePanel",
        why: "Displays connection, mailing-list scan, delete filters, block list, free and Pro state, license activation, progress, and the required footer cards beside Gmail.",
      },
    ],
    network: [
      {
        id: "https://mail.google.com/*",
        why: "The content script adds exactly two buttons — Super Unsubscribe and Super Delete — to Gmail's toolbar and shows a first-launch how-to. It reads only the sender address and name of the rows you tick in order to act on them.",
      },
      {
        id: "https://gmail.googleapis.com/* and https://www.googleapis.com/*",
        why: "Reads supported message headers, moves messages you select to Trash, sends the unsubscribe email a sender's List-Unsubscribe header asks for when you unsubscribe from that sender, and manages the ordinary Gmail filter used only when a sender offers no automatic unsubscribe — all authenticated by your own Google session and sent only to Google.",
      },
      {
        id: "A sender's one-click unsubscribe endpoint",
        why: "When you unsubscribe from a sender whose List-Unsubscribe header offers a standards-based (RFC 8058) one-click HTTPS endpoint, Gmail Cleaner posts the fixed body List-Unsubscribe=One-Click to that sender-provided address, without cookies. No email content, address, token, or other data is added.",
      },
      {
        id: "https://www.google.com/s2/favicons",
        why: "Shows the logo of senders listed in the side panel. Only a sender's website domain (for example, shop.com) is requested from Google's favicon service — never an email address, name, message content, or token. Personal email domains such as gmail.com are not requested.",
      },
      {
        id: "https://cleanmysocial.com/api/license",
        why: "Validates a license key you paste for Gmail Cleaner. The request contains only the key and public product slug, never your email address, message content, or tokens. Rejected keys are not stored.",
      },
      {
        id: "https://cleanmysocial.com/api/telemetry and https://cleanmysocial.com/api/report",
        why: "Sends count-once anonymous product milestones and privacy-filtered technical crashes through one delayed queue, plus a separate closed platform-breakage code. They contain the product slug, extension version, locale, anonymous installation identifier, and allowlisted diagnostics — no email content, addresses, headers, cookies, tokens, or account identifiers.",
      },
    ],
    dataAccessed: [
      "The email address of the signed-in Google account, used only to confirm which mailbox is being cleaned and that the Gmail toolbar buttons act on the same account as the Gmail tab you are using.",
      "The From header of every email Gmail flags as a mailing list, reduced to sender addresses, display names, and email counts, kept in local extension storage for the side panel and never sent to CleanMySocial.",
      "For senders you choose to unsubscribe from, the List-Unsubscribe headers of their most recent messages, read at that moment to find the sender's unsubscribe method.",
      "Message identifiers for the senders you explicitly delete, used to move those messages to Trash. Email bodies, subjects, and attachments are not read.",
      "Your delete filters, block list, lifetime count of cleaned senders, today's deletion and unsubscribe counts, review-prompt preference, and a validated purchased license key.",
      "A random installation UUID, count-once product milestones, and technical crash details sent to CleanMySocial through a delayed telemetry queue. The milestones record only install, first cleanup, free-cap, Pro-link, and review-link events; they contain no Gmail or account data.",
    ],
    notes: [
      "Gmail Cleaner is free to use with a local daily allowance of 100 emails moved to Trash and 5 Super Unsubscribes. Optional 3-day, monthly, or lifetime Pro access removes those limits. No CleanMySocial account is required, and no Gmail sign-in is sent to CleanMySocial.",
      "A Super Unsubscribe is one sender processed — unsubscribed, or blocked because it offers no automatic unsubscribe.",
      "Moving messages to Trash is reversible in Gmail for the usual retention window; emptying Trash is not. Unsubscribing uses the sender's own List-Unsubscribe header: a one-click request, or the unsubscribe email the sender asks for, sent from your Gmail so it appears in your Sent folder. A sender that offers no automatic unsubscribe is not unsubscribed and no page is opened; it is blocked with a Gmail filter instead. Gmail Cleaner cannot confirm what a sender does after receiving a request. Blocking adds a standard Gmail filter you can remove at any time.",
      "The Chrome Web Store review page opens only when you choose the review action after a completed-action milestone.",
      "There is no advertising or third-party tracking. Customer-triggered license validation, anonymous count-once product milestones, and privacy-limited operational diagnostics are the only CleanMySocial network requests while installed.",
      "Gmail Cleaner is not affiliated with or endorsed by Google.",
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
