import Link from "next/link";
import Image from "next/image";
import { BUNDLE_PLAN, EXTENSIONS } from "@/lib/extensions";
import { Rating } from "./ExtensionBadge";

export default function HomePage() {
  return (
    <div className="home marketing-page">
      <section className="home-hero">
        <span className="eyebrow">Five focused Chrome extensions</span>
        <h1>Clean up your social life—without the endless clicking.</h1>
        <p>
          Clean up your own Messenger inbox, Facebook friends list, Instagram
          DMs, and Instagram following list with focused tools that run in your
          browser.
        </p>
        <div className="hero-actions">
          <Link className="btn" href="/pricing">
            Get all {EXTENSIONS.length} tools for {BUNDLE_PLAN.price}
          </Link>
          <a className="btn secondary" href="#extensions">See the extensions</a>
        </div>
        <p className="hero-note">One-time payment · lifetime access · 14-day money-back guarantee</p>
      </section>

      <section id="extensions" className="tools" aria-label="CleanMySocial extensions">
        {EXTENSIONS.map((ext) => (
          <Link className="tool" href={`/${ext.slug}`} key={ext.slug}>
            <Image
              className="tool-icon"
              src={ext.icon}
              alt=""
              width={88}
              height={88}
            />
            <span className="tool-name">{ext.name}</span>
            <Rating ext={ext} linked={false} />
            <span className="tool-learn">Learn more <span aria-hidden="true">→</span></span>
          </Link>
        ))}
      </section>

      <section className="bundle">
        <div>
          <span className="eyebrow">The CleanMySocial bundle</span>
          <h2>One license. All {EXTENSIONS.length} tools. Paid once.</h2>
          <p>
            Clean your Messenger inbox, your Instagram DMs, your Facebook
            friends list and your Instagram following list — every tool we make,
            unlocked for life, with no subscription and no per-tool upgrades.
          </p>
        </div>
        <div className="bundle-price">
          <strong>{BUNDLE_PLAN.price}</strong>
          <span>one time</span>
          <Link className="btn" href="/pricing">Buy CleanMySocial</Link>
        </div>
      </section>

      <section className="steps" aria-label="How it works">
        <div className="step"><span className="step-num">1</span><span>Install the extensions</span></div>
        <div className="step"><span className="step-num">2</span><span>Buy one lifetime license</span></div>
        <div className="step"><span className="step-num">3</span><span>Everything unlocks, on every browser</span></div>
      </section>
    </div>
  );
}
