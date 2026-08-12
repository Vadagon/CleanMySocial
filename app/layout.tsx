import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import GoogleAnalytics from "./GoogleAnalytics";
import "./globals.css";
import "./seo-content.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — Social cleanup extensions`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  category: "technology",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#090d18" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <GoogleAnalytics />
        <header className="site-header">
          <div className="container nav">
            <Link href="/" className="brand">
              {SITE.name}
            </Link>
            <nav className="nav-links">
              <Link href="/#extensions">Extensions</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/blog">Guides</Link>
              <Link href="/support">Support</Link>
            </nav>
          </div>
        </header>

        <main className="container">{children}</main>

        <footer className="site-footer">
          <div className="container footer-inner">
            <span>
              © {new Date().getFullYear()} {SITE.legalName} · Individual
              developer of {SITE.name}
            </span>
            <span className="footer-links">
              <Link href="/pricing">Pricing</Link>
              <Link href="/blog">Guides</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/refund">Refund Policy</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/support">Support</Link>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
