export function SecureCheckoutLabel() {
  return (
    <div className="secure-checkout" aria-label="Secure checkout">
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <rect x="5.5" y="8.5" width="9" height="7.5" rx="1.5" />
        <path d="M7.5 8.5V6.7a2.5 2.5 0 0 1 5 0v1.8" />
      </svg>
      Secure checkout
    </div>
  );
}

export function PurchaseTrustBadges() {
  return (
    <ul className="trust-badges" aria-label="Purchase guarantees">
      <li>
        <span className="trust-icon" aria-hidden="true">↺</span>
        <span>
          <strong>14-day money back</strong>
          <span className="trust-sub">If it&rsquo;s not right for you</span>
        </span>
      </li>
      <li>
        <span className="trust-icon trust-icon-creem" aria-hidden="true">
          <img src="/creem-logo.svg" alt="" />
        </span>
        <span>
          <strong>Creem handles payment</strong>
          <span className="trust-sub">Merchant of Record · we never see your card</span>
        </span>
      </li>
      <li>
        <span className="trust-icon" aria-hidden="true">✓</span>
        <span>
          <strong>No account needed</strong>
          <span className="trust-sub">One-time payment, lifetime access</span>
        </span>
      </li>
    </ul>
  );
}

