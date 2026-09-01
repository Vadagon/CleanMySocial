"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Network } from "@/lib/networks";
import type { Extension } from "@/lib/extensions";
import NetworkLogo from "./NetworkLogo";
import type { Locale } from "@/lib/locales";
import { localePath } from "@/lib/locale-path";

/**
 * Two steps in one container: pick a network, then see the tools for it.
 *
 * The list of extensions grew past the point where four hand-picked task cards
 * could represent it, and people arrive knowing which network is bothering
 * them long before they know which tool they want.
 */
export default function NetworkPicker({
  networks,
  locale,
}: {
  networks: (Network & {
    summary: string;
    tools: Pick<Extension, "slug" | "shortName" | "tagline" | "icon">[];
    freeSlugs: string[];
  })[];
  locale: Locale;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  // Which way the panel should slide. Forward when a network is opened, back
  // when returning to the list.
  const [back, setBack] = useState(false);
  const open = networks.find((network) => network.id === openId) ?? null;

  return (
    <aside className="home-task-picker" aria-label="Find a cleanup tool">
      <div
        className={`home-picker-step${back ? " home-picker-step--back" : ""}`}
        key={open ? open.id : "networks"}
      >
      {open ? (
        <>
          <div className="home-picker-head">
            <button
              type="button"
              className="home-picker-back"
              onClick={() => {
                setBack(true);
                setOpenId(null);
              }}
              aria-label="Back to all networks"
            >
              ←
            </button>
            <span className="home-task-label home-task-label--inline">
              Cleaning {open.name}
            </span>
          </div>

          {open.tools.map((tool) => (
            <Link href={localePath(locale, `/${tool.slug}`)} key={tool.slug}>
              <Image src={tool.icon} alt="" width={44} height={44} />
              <span>
                <strong>
                  {tool.shortName}
                  {open.freeSlugs.includes(tool.slug) ? (
                    <em className="home-picker-free">Unlimited</em>
                  ) : null}
                </strong>
                <small>{tool.tagline}</small>
              </span>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </>
      ) : (
        <>
          <span className="home-task-label">What do you want to clean?</span>
          {networks.map((network) => (
            <button
              type="button"
              key={network.id}
              className="home-network-row"
              onClick={() => {
                setBack(false);
                setOpenId(network.id);
              }}
            >
              <span className="home-network-mark" style={{ background: network.background }}>
                <NetworkLogo id={network.id} />
              </span>
              <strong>{network.name}</strong>
              <span className="home-network-count">{network.summary}</span>
              <span aria-hidden="true">→</span>
            </button>
          ))}
        </>
      )}
      </div>
    </aside>
  );
}
