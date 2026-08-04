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
    name: "CleanMySocial Mass Unfriender",
    storeId: "fegkbiinmaoipoonnlhekdoefgebmdnj",
    platform: "Facebook",
    summary: "select and remove multiple friends from your own Facebook account.",
    lastUpdated: UPDATED,
    localOnly: true,
    billed: true,
    permissions: [
      {
        id: "activeTab",
        why: "Gives temporary access to the Facebook tab only after you invoke the extension.",
      },
      {
        id: "scripting",
        why: "Adds the selection interface and performs the unfriend actions you request in your signed-in Facebook tab.",
      },
      {
        id: "storage",
        why: "Stores the randomly generated license key and its validation status in Chrome storage.",
      },
    ],
    network: [LICENSE_HOST],
    dataAccessed: [
      "Your visible Facebook friends list, processed locally so you can select whom to remove. The list and the names of removed friends are not collected, stored, or sent to the developer.",
      "A randomly generated license identifier used to buy, validate, or restore access. It contains no Facebook account information.",
    ],
    notes: [
      "The extension runs only when you open it on your Facebook friends-list page and initiate the removal workflow.",
      "Unfriending changes your Facebook account and may not be reversible without sending a new friend request.",
      "The extension contains no advertising, behavioral analytics, or third-party tracking.",
    ],
  },
  {
    slug: "instagram-dm-cleaner",
    name: "DM Cleaner – Bulk Delete Instagram Messages",
    storeId: "aekeomcopkngciopbjbdmlmpgfdcndmm",
    platform: "Instagram",
    summary:
      "scan one conversation you choose and bulk unsend messages sent by your own account.",
    lastUpdated: UPDATED,
    localOnly: true,
    billed: false,
    permissions: [
      {
        id: "storage",
        why: "Stores temporary scan and deletion progress, settings, and review preferences locally in Chrome.",
      },
      {
        id: "webRequest",
        why: "Reads only the Instagram request headers needed to make authenticated Instagram requests through your existing session. The headers are not sent to the developer.",
      },
      {
        id: "webNavigation",
        why: "Detects Instagram in-page navigation so the panel updates when you open or leave a conversation.",
      },
      {
        id: "tabs",
        why: "Identifies the active Instagram tab and ensures the visible selected conversation is used.",
      },
      {
        id: "cookies",
        why: "Checks whether you are signed in to Instagram and uses your existing session. Cookies are not modified or sent to the developer.",
      },
      {
        id: "sidePanel",
        why: "Displays scan, date-filter, progress, stop, and unsend controls beside Instagram.",
      },
      {
        id: "scripting",
        why: "Submits confirmed unsend actions inside the selected Instagram tab.",
      },
    ],
    network: [
      {
        id: "https://www.instagram.com/*",
        why: "Scans the selected conversation and sends confirmed unsend requests directly to Instagram using your existing session. No other website receives Instagram data.",
      },
    ],
    dataAccessed: [
      "The selected conversation's thread identifier, participant name, username, profile image URL, and group status, used locally to identify the conversation being cleaned.",
      "Message identifiers, sender status, message type, and timestamps needed to find your messages and apply date filters. Message content is not saved, backed up, exported, or sent to the developer.",
      "Instagram sign-in status and required authentication headers, used only to communicate directly with Instagram. The developer does not receive your password, cookies, or authentication tokens.",
      "Temporary scan and deletion progress and preferences stored in Chrome. You can remove this data by clearing the extension's storage or uninstalling it.",
    ],
    notes: [
      "DM Cleaner is free and has no quotas, checkout, subscription, license service, analytics, advertising, or tracking.",
      "Only messages sent by your account can be unsent. A successful unsend removes the message from the conversation for everyone and cannot be reversed through the extension.",
      "The extension uses the conversation visible in the active Chrome tab and stops if you navigate away.",
    ],
  },
];

const PRIVACY_ALIASES: Record<string, string> = {
  "messenger-cleaner": "facebook-instagram-cleaner",
  "mass-friends-remover": "mass-unfriender",
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
