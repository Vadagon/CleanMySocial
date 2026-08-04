Instagram doesn't give you a download button, and most "downloader" websites want you to paste links into sketchy pages covered in ads. But here's the thing: **your browser already downloaded the photo or video the moment you viewed it.** Chrome DevTools lets you grab it — no apps, no websites, no login handed to anyone. Here's exactly how.

## Downloading a photo with DevTools

1. Open the Instagram post in Chrome and press **F12** (or right-click → *Inspect*) to open DevTools.
2. Go to the **Network** tab and click the **Img** filter.
3. Reload the page (**Ctrl/Cmd + R**) so the requests are captured.
4. Look through the image requests — sort by size; the post photo is usually the largest one, from a domain like `scontent-*.cdninstagram.com`.
5. Click it, open the **Preview** tab to confirm it's the right image, then right-click the request → **Open in new tab**.
6. In the new tab, right-click → **Save image as…** — that's the full-resolution original.

A quicker variant for photos: with the post open, press **Ctrl/Cmd + U** style source digging is unreliable now, but the Network method above works every time.

## Downloading a video or Reel

Videos are trickier, because Instagram streams them in chunks:

1. Open the Reel or video post, DevTools → **Network** tab, filter by **Media** (or type `.mp4` in the filter box).
2. Play the video and watch the requests appear.
3. Find an `.mp4` request, right-click → **Copy URL**, and open it in a new tab. If the URL has `&bytestart=`/`&byteend=` parameters, delete everything from `&bytestart` onward to get the whole file instead of a chunk.
4. Right-click the playing video → **Save video as…**

Note that video and audio are sometimes served as *separate* streams — in that case you'll get silent video this way, which is where the DIY method hits its wall.

## The honest downsides of the DevTools method

It works, it's free, and it's private. But:

- It's **one file at a time**, with detective work per file.
- **Carousels** make you repeat the hunt for every slide.
- **Stories** disappear before you're done fiddling.
- Split audio/video streams can leave you with silent clips.
- Downloading someone's whole profile this way would take a weekend.

For grabbing one photo occasionally, DevTools is genuinely all you need. If you do this more than once a week, automate it.

[[PROMO]]

Super Downloader does the same thing this guide does — capturing the media URLs Instagram already sends to your browser — but automatically, with a download button on every post, Reel, and Story, plus bulk download for entire profiles and Saved collections (zipped, organized, full quality). Like the DevTools method, everything happens locally in your browser: no login, no third-party servers, no watermarks. And it's completely free.

## Quick recap

- One-off photo? DevTools Network tab → Img filter → open → save.
- Video? Network tab → Media filter → grab the `.mp4`.
- Anything more than that? Use the extension and save yourself the clicking.

Only download content you have the right to save, and respect creators' ownership of their work.
