import Link from "next/link";
import Image from "next/image";
import { EXTENSIONS, PREMIUM_EXTENSIONS } from "@/lib/extensions";
import { Rating } from "./ExtensionBadge";

function ToolCard({ extension }: { extension: (typeof EXTENSIONS)[number] }) {
  return (
    <Link className="tool" href={`/${extension.slug}`}>
      <Image
        className="tool-icon"
        src={extension.icon}
        alt=""
        width={88}
        height={88}
      />
      <span className="tool-name">{extension.name}</span>
      <Rating ext={extension} linked={false} />
      <span className="tool-learn">
        Learn more <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}

export default function HomePage() {
  return (
    <div className="home marketing-page">
      <section className="home-hero">
        <div className="home-hero-copy">
          <span className="eyebrow">Focused tools for Facebook and Instagram</span>
          <h1>Clean up the social accounts you actually use.</h1>
          <p>
            Clear old conversations, trim a crowded friends list, remove sent
            messages, and understand your Instagram following—without doing it
            all one click at a time.
          </p>
          <div className="hero-actions">
            <a className="btn" href="#extensions">Find your cleanup tool</a>
            <Link className="home-text-link" href="/pricing">
              Compare products and pricing →
            </Link>
          </div>
          <p className="hero-note">
            Runs in Chrome · You stay in control · Free and paid options
          </p>
        </div>

        <aside className="home-task-picker" aria-label="Popular cleanup tasks">
          <span className="home-task-label">What would you like to clean?</span>
          <Link href="/facebook-instagram-cleaner">
            <Image src="/extensions/facebook-instagram-cleaner.png" alt="" width={44} height={44} />
            <span><strong>Messages</strong><small>Messenger and Instagram DMs</small></span>
            <span aria-hidden="true">→</span>
          </Link>
          <Link href="/mass-unfriender">
            <Image src="/extensions/mass-unfriender.png" alt="" width={44} height={44} />
            <span><strong>Facebook friends</strong><small>Review and remove in bulk</small></span>
            <span aria-hidden="true">→</span>
          </Link>
          <Link href="/instagram-followers-tracker">
            <Image src="/extensions/instagram-followers-tracker.png" alt="" width={44} height={44} />
            <span><strong>Instagram following</strong><small>Track unfollowers and bulk unfollow</small></span>
            <span aria-hidden="true">→</span>
          </Link>
        </aside>
      </section>

      <section className="home-value-strip" aria-label="Why CleanMySocial">
        <span><strong>Focused</strong>One job per extension</span>
        <span><strong>Controlled</strong>You choose what changes</span>
        <span><strong>Browser-based</strong>No account handoff</span>
      </section>

      <section id="extensions" className="home-products" aria-labelledby="home-products-title">
        <header className="home-section-heading">
          <div>
            <span className="eyebrow">Choose by task</span>
            <h2 id="home-products-title">Start with what you want to clean.</h2>
            <p>
              Every card opens a full product page with screenshots and details
              before you install or buy.
            </p>
          </div>
          <Link href="/pricing">Compare pricing and packages →</Link>
        </header>

        <div className="home-tool-group">
          <div className="home-tool-group-heading">
            <h3>Premium cleanup tools</h3>
            <span>Monthly or lifetime access, depending on the tool</span>
          </div>
          <div className="tools tools-premium">
            {PREMIUM_EXTENSIONS.map((extension) => (
              <ToolCard extension={extension} key={extension.slug} />
            ))}
          </div>
        </div>

      </section>

      <section className="home-closing">
        <div>
          <span className="eyebrow">Need more than one?</span>
          <h2>Compare individual tools and discounted packages.</h2>
        </div>
        <Link className="btn secondary" href="/pricing">
          Explore pricing
        </Link>
      </section>
    </div>
  );
}
