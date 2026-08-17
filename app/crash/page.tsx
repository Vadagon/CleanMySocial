import type { Metadata } from "next";
import "../globals.css";
import CrashDashboard from "./CrashDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Crash dashboard",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function CrashPage() {
  return <CrashDashboard />;
}
