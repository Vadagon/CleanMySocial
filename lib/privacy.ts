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
  id: "https://cleanmysocial.verblike.com/*",
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
      "A randomly generated license identifier, sent only to cleanmysocial.verblike.com to purchase or validate unlimited access. It contains no social-account information.",
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
];

const PRIVACY_ALIASES: Record<string, string> = {
  "messenger-cleaner": "facebook-instagram-cleaner",
  "mass-friends-remover": "mass-unfriender",
  "followers-tracker": "instagram-followers-tracker",
  "ig-followers-tracker": "instagram-followers-tracker",
};

export const PRIVACY_STATIC_SLUGS = [
  ...PRIVACY.map((policy) => policy.slug),
  ...Object.keys(PRIVACY_ALIASES),
];

export function getPrivacy(slug: string): ExtPrivacy | undefined {
  const canonicalSlug = PRIVACY_ALIASES[slug] || slug;
  return PRIVACY.find((policy) => policy.slug === canonicalSlug);
}
