# Extension screenshots

Drop files here as `public/screenshots/<slug>/<name>.png`, then list them on the
extension in `lib/extensions.ts`:

```ts
screenshots: [
  { src: "/screenshots/mass-unfriender/results.png", alt: "Selecting friends to remove" },
],
```

They render on `/<slug>`. Nothing appears until the array is set, so a missing
file can never produce a broken image.

The quickest source is the Chrome Web Store listing you already published —
open the listing, save the screenshots, drop them in. Prefer 1280x800 PNGs
showing a real result (a finished run, a populated table) over an empty UI.
