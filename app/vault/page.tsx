import type { Metadata } from "next";
import RecordsBrowser from "./RecordsBrowser";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vault",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function VaultPage() {
  return <RecordsBrowser />;
}
