import type { Metadata } from "next";
import InstalledPage from "./InstalledPage";
import { lifecycleCopy } from "@/lib/lifecycle-copy";
import { DEFAULT_LOCALE } from "@/lib/locales";
import "../globals.css";

export const metadata: Metadata = {
  title: "Installed",
  robots: { index: false, follow: false },
};

/** Fallback for an extension that opens /installed without naming itself. */
export default function Installed() {
  return <InstalledPage ext={null} copy={lifecycleCopy(DEFAULT_LOCALE)} locale={DEFAULT_LOCALE} />;
}
