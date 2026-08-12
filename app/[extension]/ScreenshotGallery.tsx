"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Screenshot = {
  src: string;
  alt: string;
};

export default function ScreenshotGallery({
  name,
  screenshots,
}: {
  name: string;
  screenshots: Screenshot[];
}) {
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    if (active === null) return;

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
      if (screenshots.length > 1 && event.key === "ArrowLeft") {
        setActive((current) =>
          current === null ? null : (current - 1 + screenshots.length) % screenshots.length,
        );
      }
      if (screenshots.length > 1 && event.key === "ArrowRight") {
        setActive((current) =>
          current === null ? null : (current + 1) % screenshots.length,
        );
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [active, screenshots.length]);

  const activeScreenshot = active === null ? null : screenshots[active];

  return (
    <section className="extension-gallery" aria-label={`${name} screenshots`}>
      {screenshots.map((shot, index) => (
        <figure key={shot.src}>
          <button
            type="button"
            className="gallery-frame"
            onClick={() => setActive(index)}
            aria-label={`Expand screenshot: ${shot.alt}`}
          >
            <Image
              className="gallery-thumbnail"
              src={shot.src}
              alt={shot.alt}
              width={640}
              height={400}
            />
            <span className="gallery-expand-hint" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" />
                <path d="m16 16 4 4M8 11h6M11 8v6" />
              </svg>
              View larger
            </span>
          </button>
          <figcaption>{shot.alt}</figcaption>
        </figure>
      ))}

      {activeScreenshot ? (
        <div
          className="gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Expanded screenshot: ${activeScreenshot.alt}`}
          onMouseDown={() => setActive(null)}
        >
          <button
            type="button"
            className="gallery-close"
            onClick={() => setActive(null)}
            aria-label="Close expanded screenshot"
          >
            ×
          </button>
          {screenshots.length > 1 ? (
            <button
              type="button"
              className="gallery-nav gallery-nav--previous"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={() =>
                setActive((current) =>
                  current === null
                    ? null
                    : (current - 1 + screenshots.length) % screenshots.length,
                )
              }
              aria-label="Previous screenshot"
            >
              ‹
            </button>
          ) : null}
          <div
            className="gallery-lightbox-content"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <Image
              src={activeScreenshot.src}
              alt={activeScreenshot.alt}
              width={1600}
              height={1000}
              priority
            />
            <p>{activeScreenshot.alt}</p>
          </div>
          {screenshots.length > 1 ? (
            <button
              type="button"
              className="gallery-nav gallery-nav--next"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={() =>
                setActive((current) =>
                  current === null ? null : (current + 1) % screenshots.length,
                )
              }
              aria-label="Next screenshot"
            >
              ›
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
