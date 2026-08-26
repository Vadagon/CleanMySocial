import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import GoogleAnalytics from "./GoogleAnalytics";
import { getRequestLocale } from "@/lib/request-locale";
import { htmlLocale, localeDirection } from "@/lib/locales";
import { lifecycleCopy } from "@/lib/lifecycle-copy";
import "./base.css";

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getRequestLocale();
  const lifecycle = lifecycleCopy(locale);
  const spanish = locale === "es" || locale === "es_419";
  const chromeCopy = spanish
    ? { extensions: "Extensiones", pricing: "Precios", guides: "Guías", changelog: "Novedades", terms: "Términos", refund: "Reembolsos", developer: "Desarrollador de" }
    : { extensions: "Extensions", pricing: "Pricing", guides: "Guides", changelog: "Changelog", terms: "Terms", refund: "Refund Policy", developer: "Developer of" };
  const withLocale = (path: string) => `${path}${path.includes("?") ? "&" : "?"}lang=${locale}`;
  return (
    <html lang={htmlLocale(locale)} dir={localeDirection(locale)}>
      <body>
        <GoogleAnalytics />
        <header className="site-header">
          <div className="container nav">
            <Link href="/" className="brand">
              {SITE.name}
            </Link>
            <nav className="nav-links">
              <Link href={`/?lang=${locale}#extensions`}>{chromeCopy.extensions}</Link>
              <Link href={withLocale("/pricing")}>{chromeCopy.pricing}</Link>
              <Link href={withLocale("/support")}>{lifecycle.support}</Link>
            </nav>
          </div>
        </header>

        <main className="container">{children}</main>

        <footer className="site-footer">
          <div className="container footer-inner">
            <span>
              © {new Date().getFullYear()} {SITE.legalName} · {chromeCopy.developer}{" "}
              {SITE.name}
            </span>
            <span className="footer-links">
              <Link href={withLocale("/pricing")}>{chromeCopy.pricing}</Link>
              <Link href={withLocale("/blog")}>{chromeCopy.guides}</Link>
              <Link href={withLocale("/changelog")}>{chromeCopy.changelog}</Link>
              <Link href={withLocale("/terms")}>{chromeCopy.terms}</Link>
              <Link href={withLocale("/refund")}>{chromeCopy.refund}</Link>
              <Link href={withLocale("/privacy")}>{lifecycle.privacy}</Link>
              <Link href={withLocale("/support")}>{lifecycle.support}</Link>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
