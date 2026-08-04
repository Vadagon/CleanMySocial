Carousels — posts with multiple photos or videos you swipe through — are the single most annoying thing to download from Instagram. Single photos are easy; carousels fight back. Most downloader websites grab only the first slide and call it done. Here's how to get **every slide, in original quality**, two ways.

## Why carousels are hard

Instagram loads carousel slides lazily — slides you haven't swiped to may not even be loaded by your browser yet — and each slide is a separate media file (some photos, some videos, mixed in one post). Any tool that just scrapes "the image on the page" gets slide one and nothing else. A proper download means collecting each slide's own full-resolution URL.

## Method 1: Chrome DevTools (free, manual)

You can do it by hand with the browser's built-in developer tools:

1. Open the carousel post in Chrome and press **F12** → **Network** tab.
2. Filter by **Img** (use **Media** for video slides).
3. Now swipe through the carousel slide by slide — as each slide loads, its full-size file appears in the request list (large files from `cdninstagram.com`).
4. For each slide: click the request → **Open in new tab** → right-click → **Save image as…** (or *Save video as…*).
5. Repeat until you've swiped and saved every slide.

It genuinely works, and the files are the full-quality originals. But be honest with yourself about the workflow: a 10-slide carousel means ten rounds of swipe → find request → open → save → rename, because everything comes out named like `487213985_n.jpg`. One carousel, fine. A profile full of them, no.

(If you want the deeper version of this technique — including how to handle chunked video URLs — see our full [DevTools download guide](/blog/download-instagram-media-devtools).)

## Method 2: One click with an extension

[[PROMO]]

Super Downloader was built with carousels as a first-class case: hover any post and click download, and it captures **every slide** — photos and videos both — in the highest quality Instagram serves, properly grouped so a 10-slide post lands as ten sensibly named files in one folder. It works the same on a single post or when bulk-downloading a whole profile (where skipped carousel slides are exactly what other tools silently lose). Free, no login, runs entirely in your browser.

## Quick answers

- **Does quality drop?** No — both methods above pull the original CDN files, not screenshots or re-compressed copies.
- **Can I download mixed photo+video carousels?** Yes; in DevTools you'll switch between the Img and Media filters, the extension just handles both.
- **Does the poster get notified?** No. Instagram doesn't notify anyone about downloads or screenshots of posts.
- **Private accounts?** Only content you can legitimately see while logged in as yourself. Nothing can (or should) bypass that.

As always: save for personal use, and if you want to repost someone's work, ask them — a downloaded carousel is still their carousel.
