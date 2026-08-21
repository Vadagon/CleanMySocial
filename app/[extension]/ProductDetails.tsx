import { detailHeadingsFor, type Extension } from "@/lib/extensions";

/**
 * Features, steps, limits and FAQ as collapsible sections.
 *
 * Deliberately native `<details>`/`<summary>`, not a React toggle:
 *
 *   - An earlier version of this block was a client component that rendered
 *     `hidden={!expanded}`. The server HTML therefore shipped the page's most
 *     useful text marked hidden, and crawlers that do not run JavaScript —
 *     most of the ones feeding answer engines — dropped it. `<details>` keeps
 *     the content in the DOM and un-hidden, so it is still indexed and still
 *     extractable while collapsed. Google's FAQ guidance explicitly allows
 *     expandable FAQ content.
 *   - It costs no JavaScript, and keyboard and screen-reader behaviour comes
 *     free.
 *
 * If you ever swap this for a scripted accordion, keep the panels out of the
 * `hidden` attribute and off `display: none` in the server output.
 *
 * Every section starts closed, so the page opens compact and the buyer sees the
 * four headings at once rather than scrolling past one expanded list. The
 * content is still in the HTML, so crawlers and answer engines read all of it.
 */
export default function ProductDetails({ ext }: { ext: Extension }) {
  const headings = detailHeadingsFor(ext);

  return (
    <section className="product-details" aria-label={`About ${ext.name}`}>
      <details className="product-details-group">
        <summary>
          <h2 id="product-details-title">{headings.features}</h2>
        </summary>
        <ul>
          {ext.features.map((feature) => <li key={feature}>{feature}</li>)}
        </ul>
      </details>

      <details className="product-details-group">
        <summary>
          <h2>{headings.steps}</h2>
        </summary>
        <ol>
          {ext.steps.map((step) => <li key={step}>{step}</li>)}
        </ol>
      </details>

      <details className="product-details-group">
        <summary>
          <h2>{headings.limitations}</h2>
        </summary>
        <ul className="product-details-limits">
          {ext.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
        </ul>
      </details>

      <details className="product-details-group">
        <summary>
          <h2>{headings.faq}</h2>
        </summary>
        {/* Question as a heading with the answer directly beneath: the shape
            both the FAQPage schema and answer-engine extraction expect. */}
        <div className="product-details-faq">
          {ext.faq.map((item) => (
            <div key={item.question}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
