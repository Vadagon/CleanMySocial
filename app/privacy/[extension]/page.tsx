import Link from "next/link";
import "../../globals.css";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PRIVACY_STATIC_SLUGS, getPrivacy } from "@/lib/privacy";
import { SITE } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return PRIVACY_STATIC_SLUGS.map((extension) => ({ extension }));
}

export async function generateMetadata({ params }: { params: Promise<{ extension: string }> }): Promise<Metadata> {
  const { extension } = await params;
  const p = getPrivacy(extension);
  if (!p) return { title: "Not found" };
  return pageMetadata({
    title: `${p.name} — Privacy Policy`,
    description: `Privacy policy for ${p.name}, including data access, Chrome permissions, local processing, licensing, and payments.`,
    path: `/privacy/${p.slug}`,
  });
}

function CheckIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg>;
}

export default async function ExtensionPrivacyPage({ params }: { params: Promise<{ extension: string }> }) {
  const { extension } = await params;
  const p = getPrivacy(extension);
  if (!p) notFound();

  return (
    <div className="extension-privacy-page marketing-page">
      <Link className="privacy-back" href="/privacy">← Privacy center</Link>

      <header className="extension-privacy-hero">
        <div>
          <span className="privacy-kicker">Extension privacy notice</span>
          <h1>{p.name}</h1>
          <p>{p.summary}</p>
        </div>
        <dl className="extension-policy-meta">
          <div><dt>Last updated</dt><dd>{p.lastUpdated}</dd></div>
          <div><dt>Platform</dt><dd>{p.platform}</dd></div>
          <div><dt>Chrome Web Store ID</dt><dd><code>{p.storeId}</code></dd></div>
        </dl>
      </header>

      <section className="extension-trust-strip">
        <div><CheckIcon /><span><strong>Local processing</strong><small>Runs in your browser</small></span></div>
        <div><CheckIcon /><span><strong>No content collection</strong><small>Your social content is not sent to us</small></span></div>
        <div><CheckIcon /><span><strong>No data sale</strong><small>Your personal data is never sold</small></span></div>
      </section>

      <div className="extension-policy-shell">
        <aside className="extension-policy-summary">
          <span>In plain English</span>
          <p>
            {p.localOnly
              ? "The extension works inside your existing signed-in browser session. It does not require a separate account or send what you view to us."
              : "The extension runs in your browser and syncs only the data described in this notice to provide its service."}
          </p>
          <a href={`mailto:${SITE.supportEmail}`}>Ask a privacy question →</a>
        </aside>

        <article className="extension-policy-content">
          <section>
            <h2>About this notice</h2>
            <p>
              {p.name} is a browser extension developed by {SITE.legalProvider}
              as part of {SITE.name}. CleanMySocial is a product name, not a
              separate company or legal entity. It works on {p.platform}. This
              notice explains exactly what the extension accesses and where that
              data goes.
            </p>
          </section>

          <section>
            <h2>Data the extension accesses</h2>
            <ul className="extension-detail-list">
              {p.dataAccessed.map((item, index) => <li key={index}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></li>)}
            </ul>
          </section>

          <section>
            <h2>Permissions &amp; why they are needed</h2>
            <div className="permission-table">
              {p.permissions.map((permission) => (
                <div key={permission.id}><code>{permission.id}</code><p>{permission.why}</p></div>
              ))}
            </div>
          </section>

          <section>
            <h2>Network access</h2>
            {p.network.length ? (
              <div className="permission-table network-table">
                {p.network.map((item) => <div key={item.id}><code>{item.id}</code><p>{item.why}</p></div>)}
              </div>
            ) : <p>The extension makes no external network requests.</p>}
          </section>

          {p.notes?.length ? (
            <section>
              <h2>Good to know</h2>
              <ul className="privacy-check-list extension-notes">
                {p.notes.map((note, index) => <li key={index}><CheckIcon />{note}</li>)}
              </ul>
            </section>
          ) : null}

          {p.billed ? (
            <section>
              <h2>Payments</h2>
              <p>Paid plans are processed by Creem, our Merchant of Record. Creem collects and handles your payment and billing details; we receive only a transaction record and a license identifier and never see your full card details.</p>
            </section>
          ) : null}

          <section>
            <h2>Sharing, storage &amp; deletion</h2>
            <p>
              We do not sell your personal data, and we do not share the content
              you access through the extension with anyone.{p.billed ? " Purchase data is shared with Creem solely to process payments." : ""}
            </p>
            <p>
              Operational settings and progress described above are kept in
              Chrome extension storage on your device. Uninstalling the extension
              removes its local storage; Chrome may retain values stored in sync
              according to your Chrome sync settings.{p.billed ? " We retain purchase and license records only as long as needed to provide access, handle refunds or disputes, prevent abuse, and meet legal or accounting requirements." : ""}
            </p>
          </section>

          <section>
            <h2>Security, children &amp; changes</h2>
            <p>We use reasonable safeguards for the limited license and purchase data we process. The extension is not directed to children under 13. If this policy changes, the revised text and date will be published on this page.</p>
          </section>

          <section className="extension-policy-contact">
            <span>Your rights &amp; contact</span>
            <h2>Want to access or delete data?</h2>
            <p>
              Email us to request access to or deletion of data associated with
              {p.billed ? " your purchase, support request, or technical report" : " your support request or technical report"}.
              You can also read the <Link href="/privacy">product-wide Privacy Policy</Link>.
            </p>
            <a className="btn" href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>
          </section>
        </article>
      </div>
    </div>
  );
}
