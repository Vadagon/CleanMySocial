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
    version: "57.0",
    updated: "August 25, 2026",
    updatedIso: "2026-08-25",
    minimumChrome: "114",
    changes: [
      "Added the Fast-to-Standard free cleanup journey and Pro-only Super Speed.",
      "Added milestone-based review requests, an immediate action-30 cap, and atomic confirmed-removal metering.",
      "Completed lifecycle, crash reporting, and 27-locale shipping contracts.",
    ],
  },
  {
    slug: "instagram-followers-tracker",
    version: "1.4.0",
    updated: "August 24, 2026",
    updatedIso: "2026-08-24",
    changes: [
      "Added free automated cleanup with Fast and Standard speeds plus unlimited Super Speed for Pro.",
      "Updated license activation, subscription revalidation, and install/uninstall lifecycle behavior.",
      "Added privacy-safe technical reporting, real daily notifications, and the canonical 27 locales.",
    ],
  },
];

export function getPublicRelease(slug: string): PublicRelease | undefined {
  return PUBLIC_RELEASES.find((release) => release.slug === slug);
}
