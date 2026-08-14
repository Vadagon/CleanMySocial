function RefundIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8.2 7H4.5V3.3" />
      <path d="M4.8 7.1A8 8 0 1 1 4 14" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6.5 12.5 3.5 3.5 7.5-9" />
    </svg>
  );
}

function CreemIcon() {
  return (
    <svg viewBox="0 0 121 121" aria-hidden="true">
      <path d="M21.1102 11C23.1187 11.0001 24.9669 12.0982 25.9281 13.8619L50.2059 58.4106C51.5699 60.9134 54.7048 61.8368 57.2077 60.473C59.7108 59.109 60.6342 55.9742 59.2701 53.4712L40.5466 19.113C38.554 15.4566 41.2004 11 45.3645 11H102.806C106.885 11 109.539 15.2933 107.715 18.9416L64.0579 106.254C62.0356 110.298 56.2654 110.298 54.2431 106.254L10.5863 18.9416C8.76212 15.2933 11.4156 11 15.4946 11H21.1102Z" />
    </svg>
  );
}

export function PurchaseTrustBadges({ detail = false }: { detail?: boolean }) {
  if (detail) {
    return (
      <ul className="trust-badges detail-trust-badges" aria-label="Purchase guarantees">
        <li>
          <span className="trust-icon" aria-hidden="true"><RefundIcon /></span>
          <span>
            <strong>14-day money back</strong>
            <span className="trust-sub">Not happy? Get a full refund.</span>
          </span>
        </li>
        <li>
          <span className="trust-icon trust-icon-creem" aria-hidden="true">
            <CreemIcon />
          </span>
          <span>
            <strong>Secure checkout by Creem</strong>
            <span className="trust-sub">Encrypted and secure payment processed by Creem.</span>
          </span>
        </li>
        <li>
          <span className="trust-icon" aria-hidden="true"><CheckIcon /></span>
          <span>
            <strong>No subscription</strong>
            <span className="trust-sub">One payment. Use it forever.</span>
          </span>
        </li>
      </ul>
    );
  }

  return (
    <ul className="trust-badges" aria-label="Purchase guarantees">
      <li>
        <span className="trust-icon" aria-hidden="true">↺</span>
        <span>
          <strong>14-day money-back guarantee</strong>
          <span className="trust-sub">Get a full refund if it isn&rsquo;t right for you</span>
        </span>
      </li>
      <li>
        <span className="trust-icon trust-icon-creem" aria-hidden="true">
          <img src="/creem-logo.svg" alt="" />
        </span>
        <span>
          <strong>Payment handled by Creem</strong>
          <span className="trust-sub">We never see or store your card details</span>
        </span>
      </li>
      <li>
        <span className="trust-icon" aria-hidden="true">✓</span>
        <span>
          <strong>License delivered by email</strong>
          <span className="trust-sub">Your key is sent after successful payment</span>
        </span>
      </li>
    </ul>
  );
}
