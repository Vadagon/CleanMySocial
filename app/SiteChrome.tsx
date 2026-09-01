"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE } from "@/lib/site";
import { lifecycleCopy } from "@/lib/lifecycle-copy";
import { DEFAULT_LOCALE, htmlLocale, localeDirection, matchLocale } from "@/lib/locales";
import { localePath } from "@/lib/locale-path";

function localeFromPathname(pathname: string) {
  const first = pathname.split("/").filter(Boolean)[0];
  const matched = matchLocale(first);
  return matched && first === matched ? matched : DEFAULT_LOCALE;
}

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const locale = localeFromPathname(pathname);
  const lifecycle = lifecycleCopy(locale);
  const spanish = locale === "es" || locale === "es_419";
  const copy = spanish
    ? { extensions: "Extensiones", pricing: "Precios", guides: "Guías", changelog: "Novedades", terms: "Términos", refund: "Reembolsos", developer: "Desarrollador de" }
    : { extensions: "Extensions", pricing: "Pricing", guides: "Guides", changelog: "Changelog", terms: "Terms", refund: "Refund Policy", developer: "Developer of" };

  useEffect(() => {
    document.documentElement.lang = htmlLocale(locale);
    document.documentElement.dir = localeDirection(locale);
  }, [locale]);

  return (
    <>
      <header className="site-header">
        <div className="container nav">
          <Link href={localePath(locale, "/")} className="brand">{SITE.name}</Link>
          <nav className="nav-links">
            <Link href={`${localePath(locale, "/")}#extensions`}>{copy.extensions}</Link>
            <Link href="/pricing">{copy.pricing}</Link>
            <Link href="/support">{lifecycle.support}</Link>
          </nav>
        </div>
      </header>

      <main className="container">{children}</main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <span>© {new Date().getFullYear()} {SITE.legalName} · {copy.developer} {SITE.name}</span>
          <span className="footer-links">
            <Link href="/pricing">{copy.pricing}</Link>
            <Link href="/blog">{copy.guides}</Link>
            <Link href="/changelog">{copy.changelog}</Link>
            <Link href="/terms">{copy.terms}</Link>
            <Link href="/refund">{copy.refund}</Link>
            <Link href="/privacy">{lifecycle.privacy}</Link>
            <Link href="/support">{lifecycle.support}</Link>
          </span>
        </div>
      </footer>
    </>
  );
}
