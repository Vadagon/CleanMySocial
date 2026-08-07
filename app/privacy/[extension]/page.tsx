import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PRIVACY_STATIC_SLUGS, getPrivacy } from "@/lib/privacy";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  return PRIVACY_STATIC_SLUGS.map((extension) => ({ extension }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ extension: string }>;
}): Promise<Metadata> {
  const { extension } = await params;
  const p = getPrivacy(extension);
  if (!p) return { title: "Not found" };
  return {
    title: `${p.name} — Privacy Policy`,
    description: `Privacy policy for ${p.name}, including data access, Chrome permissions, local processing, licensing, and payments.`,
  };
}

export default async function ExtensionPrivacyPage({
  params,
}: {
  params: Promise<{ extension: string }>;
}) {
  const { extension } = await params;
  const p = getPrivacy(extension);
  if (!p) notFound();

  return (
    <div className="page prose content-page legal-page extension-policy-page marketing-page">
      <p className="small">
        <Link href="/support">← Support &amp; privacy</Link>
      </p>
      <h1>{p.name} — Privacy Policy</h1>
      <p className="small muted">
        Last updated: {p.lastUpdated} · Chrome Web Store ID: <code>{p.storeId}</code>
      </p>

      <p>
        {p.name} is a browser extension developed by {SITE.legalProvider} as
        part of the {SITE.name} product. CleanMySocial is a product name, not a
        separate company or legal entity. The extension lets you{" "}
        {p.summary.charAt(0).toLowerCase() + p.summary.slice(1)} It works on{" "}
        {p.platform}. This policy explains exactly what the extension accesses
        and where that data goes.
      </p>

      <h2>The short version</h2>
      <p>
        {p.localOnly ? (
          <>
            The extension runs entirely inside your own browser, in your existing
            logged-in session. It does <strong>not</strong> collect your content,
            require a separate account, or send what you view to us or any third
            party.
          </>
        ) : (
          <>
            The extension runs in your browser but syncs some data to the service
            noted below in order to work. See “Data the extension accesses” for
            details.
          </>
        )}
      </p>

      <h2>Data the extension accesses</h2>
      <ul>
        {p.dataAccessed.map((d, i) => (
          <li key={i}>{d}</li>
        ))}
      </ul>

      <h2>Permissions and why they are needed</h2>
      <ul>
        {p.permissions.map((perm) => (
          <li key={perm.id}>
            <code>{perm.id}</code> — {perm.why}
          </li>
        ))}
      </ul>

      <h2>Network access</h2>
      {p.network.length ? (
        <ul>
          {p.network.map((n) => (
            <li key={n.id}>
              <code>{n.id}</code> — {n.why}
            </li>
          ))}
        </ul>
      ) : (
        <p>The extension makes no external network requests.</p>
      )}

      {p.notes?.length ? (
        <>
          <h2>Good to know</h2>
          <ul>
            {p.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </>
      ) : null}

      {p.billed ? (
        <>
          <h2>Payments</h2>
          <p>
            Paid plans are processed by Creem, our Merchant of Record. Creem
            collects and handles your payment and billing details; we receive
            only a transaction record and a license identifier and never see your
            full card details.
          </p>
        </>
      ) : null}

      <h2>Data sharing and selling</h2>
      <p>
        We do not sell your personal data, and we do not share the content you
        access through the extension with anyone.
        {p.billed
          ? " Purchase data is shared with Creem solely to process payments."
          : ""}
      </p>

      <h2>Storage, retention, and deletion</h2>
      <p>
        Operational settings and progress described above are kept in Chrome
        extension storage on your device. Uninstalling the extension removes its
        local storage; Chrome may retain values stored in sync according to your
        Chrome sync settings. We retain purchase and license records only as long
        as needed to provide access, handle refunds or disputes, prevent abuse,
        and meet legal or accounting requirements. The standalone free extension
        creates no purchase or license record.
      </p>

      <h2>Security, children, and policy changes</h2>
      <p>
        We use reasonable safeguards for the limited license and purchase data we
        process. The extension is not directed to children under 13. If this
        policy changes, the revised text and date will be published on this page.
      </p>

      <h2>Your rights &amp; contact</h2>
      <p>
        You can request access to or deletion of any data associated with your
        purchase by emailing{" "}
        <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>. For the
        product-wide policy, see our{" "}
        <Link href="/privacy">general Privacy Policy</Link>.
      </p>
    </div>
  );
}
