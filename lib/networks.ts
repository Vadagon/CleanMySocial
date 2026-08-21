import { EXTENSIONS } from "./extensions";
import type { Extension } from "./extensions";

/**
 * The homepage asks which network someone wants to clean, then shows the tools
 * for it. One extension can appear under several networks — the Facebook &
 * Instagram cleaner covers two, and CleanFeed covers all six.
 *
 * Order within a network is deliberate: the most specific paid tool first,
 * CleanFeed last, because it is the free one and reads as the fallback.
 */
export interface Network {
  id: string;
  name: string;
  /** Letter mark, in the network's own colour. */
  mark: string;
  background: string;
  slugs: string[];
}

export const NETWORKS: Network[] = [
  {
    id: "facebook",
    name: "Facebook",
    mark: "f",
    background: "#1877f2",
    slugs: [
      "facebook-messenger-cleaner",
      "mass-unfriender",
      "facebook-activity-cleaner",
      "facebook-instagram-cleaner",
      "cleanfeed",
    ],
  },
  {
    id: "instagram",
    name: "Instagram",
    mark: "I",
    background: "linear-gradient(135deg, #f58529, #dd2a7b 55%, #8134af)",
    slugs: [
      "instagram-dm-cleaner",
      "instagram-followers-tracker",
      "facebook-instagram-cleaner",
      "cleanfeed",
    ],
  },
  { id: "reddit", name: "Reddit", mark: "R", background: "#ff4500", slugs: ["reddit-cleaner", "cleanfeed"] },
  { id: "x", name: "X (Twitter)", mark: "X", background: "#0f1419", slugs: ["cleanerx", "cleanfeed"] },
  { id: "youtube", name: "YouTube", mark: "Y", background: "#ff0000", slugs: ["cleanfeed"] },
  { id: "linkedin", name: "LinkedIn", mark: "in", background: "#0a66c2", slugs: ["cleanfeed"] },
];

export function extensionsForNetwork(network: Network): Extension[] {
  return network.slugs
    .map((slug) => EXTENSIONS.find((extension) => extension.slug === slug))
    .filter((extension): extension is Extension => Boolean(extension));
}

/** Just the count — it sits on the same line as the name, so it stays short. */
export function networkSummary(network: Network): string {
  const count = extensionsForNetwork(network).length;
  return `${count} tool${count === 1 ? "" : "s"}`;
}
