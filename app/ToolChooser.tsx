import Link from "next/link";
import { TOOL_CHOICES } from "@/lib/choices";

/**
 * The routing table: the question a search visitor actually arrives with,
 * answered in plain indexable HTML.
 *
 * Rendered on the homepage and /pricing from one source so the two can never
 * drift. See lib/choices.ts for why this exists on-page rather than only in
 * llms.txt.
 */
export default function ToolChooser({
  headingId = "tool-chooser-title",
  heading = "Which tool do you need?",
}: {
  headingId?: string;
  heading?: string;
}) {
  return (
    <section className="tool-chooser" aria-labelledby={headingId}>
      <h2 id={headingId}>{heading}</h2>
      <dl className="tool-chooser-list">
        {TOOL_CHOICES.map((choice) => (
          <div key={choice.slug}>
            <dt>{choice.when}</dt>
            <dd>
              <Link href={`/${choice.slug}`}>{choice.tool}</Link>
              <span className="tool-chooser-price">{choice.price}</span>
              <p>{choice.detail}</p>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
