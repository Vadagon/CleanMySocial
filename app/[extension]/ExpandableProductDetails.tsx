"use client";

import Link from "next/link";
import { useId, useState } from "react";

type FaqItem = {
  question: string;
  answer: string;
};

export default function ExpandableProductDetails({
  name,
  slug,
  features,
  steps,
  limitations,
  faq,
}: {
  name: string;
  slug: string;
  features: string[];
  steps: string[];
  limitations: string[];
  faq: FaqItem[];
}) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();

  return (
    <section className="extension-details" aria-labelledby={`${contentId}-title`}>
      <div className="extension-details-summary">
        <div>
          <span className="pricing-section-kicker">Product details</span>
          <h2 id={`${contentId}-title`}>Learn more about {name}</h2>
          <p>Features, setup steps, important notes, and FAQs.</p>
        </div>
        <button
          type="button"
          className="btn secondary extension-details-toggle"
          aria-controls={contentId}
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      </div>

      <div
        id={contentId}
        className="extension-details-content"
        hidden={!expanded}
      >
        <h3>What {name} does</h3>
        <ul>
          {features.map((feature) => <li key={feature}>{feature}</li>)}
        </ul>

        <h3>How it works</h3>
        <ol>
          {steps.map((step) => <li key={step}>{step}</li>)}
        </ol>

        <h3>Important notes</h3>
        <ul>
          {limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
        </ul>

        <h3>Frequently asked questions</h3>
        <dl>
          {faq.map((item) => (
            <div key={item.question}>
              <dt><strong>{item.question}</strong></dt>
              <dd>{item.answer}</dd>
            </div>
          ))}
        </dl>
        <p className="extension-details-support">
          Need help? Read the <Link href={`/privacy/${slug}`}>privacy notice</Link>, contact{" "}
          <Link href="/support">support</Link>, or see the <Link href="/changelog">changelog</Link>.
        </p>
      </div>
    </section>
  );
}
