"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/lib/locales";
import { purchaseCopy } from "@/lib/purchase-copy";

export default function ExpandableDescription({ description, locale = "en" }: { description: string; locale?: Locale }) {
  const copy = purchaseCopy(locale);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const descriptionId = useId();

  useEffect(() => {
    const paragraph = paragraphRef.current;
    if (!paragraph || expanded) return;

    const checkOverflow = () => {
      setCanExpand(paragraph.scrollHeight > paragraph.clientHeight + 1);
    };

    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(paragraph);
    return () => observer.disconnect();
  }, [description, expanded]);

  return (
    <div className="extension-description-wrap">
      <p
        ref={paragraphRef}
        id={descriptionId}
        className={`extension-description${expanded ? " is-expanded" : " is-collapsed"}`}
      >
        {description}
      </p>
      {canExpand ? (
        <button
          type="button"
          className="extension-description-toggle"
          aria-controls={descriptionId}
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? copy.showLess : copy.showMore}
        </button>
      ) : null}
    </div>
  );
}
