import Image from "next/image";
import Link from "next/link";
import type { Extension } from "@/lib/extensions";
import CrossPromo from "../CrossPromo";
import { formatCopy, type LifecycleCopy } from "@/lib/lifecycle-copy";
import { htmlLocale, localeDirection, type Locale } from "@/lib/locales";
import { installedHighlights } from "@/lib/installed-highlights";

const GENERIC_HIGHLIGHTS = [
  "Works in your current browser tab",
  "You stay in control of every action",
  "Keeps your social data in your browser",
];

/** A focused, one-screen launch moment shown immediately after installation. */
export default function InstalledPage({
  ext,
  copy,
  locale,
}: {
  ext: Extension | null;
  copy: LifecycleCopy;
  locale: Locale;
}) {
  const name = ext?.shortName ?? "CleanMySocial";
  const highlights = ext
    ? installedHighlights(locale, ext.installedPlatform, ext.installedHighlights, copy)
    : GENERIC_HIGHLIGHTS;

  return (
    <div
      className="installed-page marketing-page installed-editorial"
      lang={htmlLocale(locale)}
      dir={localeDirection(locale)}
    >
      <header className="installed-topbar">
        <Link href="/" className="installed-brand">
          <Image src="/icon.svg" alt="" width={28} height={28} priority />
          CleanMySocial
        </Link>
        <div className="installed-toolbar-guide" aria-label="Pin the extension from Chrome's Extensions menu">
          <span>{copy.pinFromExtensions}</span>
          <div aria-hidden="true">
            <i />
            <i />
            <b><Image src="/puzzle.png" alt="" width={16} height={16} /></b>
          </div>
        </div>
      </header>

      <div className="installed-layout">
        <section className="installed-product" aria-labelledby="installed-title">
          <div className="installed-mark installed-mark--large" aria-hidden="true">
            {ext ? <Image src={ext.icon} alt="" width={78} height={78} priority /> : null}
          </div>

          <p className="installed-eyebrow"><i aria-hidden="true" /> {copy.installed}</p>
          <h1 id="installed-title">{formatCopy(copy.ready, { name })}</h1>
          <p className="installed-deck">
            {formatCopy(copy.pinInstruction, { platform: ext?.installedPlatform ?? "your social network" })}
          </p>

          <div className="installed-actions">
            {ext ? (
              <a
                className="installed-launch"
                href={ext.installedUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {formatCopy(copy.open, { platform: ext.installedPlatform })} <span aria-hidden="true">↗</span>
              </a>
            ) : null}
          </div>

          <div className="installed-benefits">
            <p className="installed-section-label">{copy.readyWhen}</p>
            <ul>
              {highlights.map((highlight, index) => (
                <li key={highlight}>
                  <span aria-hidden="true">0{index + 1}</span>
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <aside className="installed-aside">
          <section className="installed-privacy" aria-labelledby="installed-privacy-title">
            <div className="installed-privacy-icon" aria-hidden="true">◆</div>
            <p className="installed-section-label">{copy.privacyDesign}</p>
            <h2 id="installed-privacy-title">{copy.dataBrowser}</h2>
            <Link href={ext ? `/privacy/${ext.slug}` : "/privacy"}>{copy.seeAccess}</Link>
          </section>

          {ext ? <CrossPromo slug={ext.slug} compact locale={locale} /> : null}
        </aside>
      </div>

      <footer className="installed-footer">
        <span>{copy.independent}</span>
        <nav aria-label="Installed page links">
          <Link href="/support">{copy.support}</Link>
          <Link href={ext ? `/privacy/${ext.slug}` : "/privacy"}>{copy.privacy}</Link>
        </nav>
      </footer>
    </div>
  );
}
