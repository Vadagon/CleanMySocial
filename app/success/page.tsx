import Link from "next/link";

export const metadata = { title: "Thank you" };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ lk?: string }>;
}) {
  const { lk } = await searchParams;

  return (
    <div className="page prose">
      <h1>Thank you for your purchase! 🎉</h1>
      <p>
        Your payment was successful. Your CleanMySocial license unlocks all
        three premium extensions automatically within a few moments, and a copy
        of your license key is on its way to the email address you gave at
        checkout.
      </p>

      {lk && (
        <div className="notice">
          <p style={{ marginTop: 0 }}>
            <strong>Your license key</strong> — it&rsquo;s already saved in your
            extension. Keep a copy to restore access on another browser or
            computer:
          </p>
          <code
            style={{
              display: "block",
              padding: "12px 14px",
              borderRadius: 10,
              background: "var(--bg-soft)",
              border: "1px solid var(--border)",
              fontSize: 15,
              wordBreak: "break-all",
            }}
          >
            {lk}
          </code>
        </div>
      )}

      <p className="muted">
        If your features don&rsquo;t unlock after a minute, reload the tab. If
        the email hasn&rsquo;t arrived after a few minutes, check your spam
        folder. Still
        stuck? Head to <Link href="/support">Support</Link> and we&rsquo;ll sort
        it out.
      </p>
      <p>
        <Link className="btn" href="/">
          Back to home
        </Link>
      </p>
    </div>
  );
}
