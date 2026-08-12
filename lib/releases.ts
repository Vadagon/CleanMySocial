export interface PublicRelease {
  slug: string;
  version: string;
  updated: string;
  updatedIso: string;
  minimumChrome?: string;
  changes: string[];
}

/**
 * Public Chrome Web Store release data, checked directly against each listing
 * on August 12, 2026. Keep this separate from local source manifests: work in
 * progress can legitimately be ahead of the version available to users.
 */
export const PUBLIC_RELEASES: PublicRelease[] = [
  {
    slug: "facebook-instagram-cleaner",
    version: "51",
    updated: "August 5, 2026",
    updatedIso: "2026-08-05",
    minimumChrome: "114",
    changes: [
      "Brought Facebook Messenger and Instagram message cleanup into one Chrome side panel.",
      "Supports Messenger conversation deletion, archiving, and restoration.",
      "Supports scanning an Instagram conversation and unsending messages sent by the signed-in account.",
    ],
  },
  {
    slug: "facebook-messenger-cleaner",
    version: "53",
    updated: "August 11, 2026",
    updatedIso: "2026-08-11",
    minimumChrome: "114",
    changes: [
      "Refreshed the persistent Messenger side-panel experience.",
      "Supports bulk delete, archive, and restore actions with explicit confirmation for deletion.",
      "Improved navigation handling and pauses cleanup safely while the Messenger tab is hidden.",
    ],
  },
  {
    slug: "mass-unfriender",
    version: "54.0",
    updated: "August 11, 2026",
    updatedIso: "2026-08-11",
    minimumChrome: "114",
    changes: [
      "Introduced the rebuilt side-panel workflow for reviewing and selecting Facebook friends.",
      "Added local list caching, resumable loading, search, filters, and paced removal runs.",
      "Added clearer reporting when a Facebook-side change interrupts the extension.",
    ],
  },
  {
    slug: "instagram-followers-tracker",
    version: "1.3.2",
    updated: "August 12, 2026",
    updatedIso: "2026-08-12",
    changes: [
      "Added follower-change history built from comparisons between the user's own scans.",
      "Added paced bulk unfollow, shield controls, and clearer rate-limit guidance.",
      "Added Pro daily scans and alerts plus local CSV and Excel export generation.",
    ],
  },
];

export function getPublicRelease(slug: string): PublicRelease | undefined {
  return PUBLIC_RELEASES.find((release) => release.slug === slug);
}
