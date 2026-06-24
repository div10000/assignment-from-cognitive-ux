# Front-End Developer Internship Assignment

One static site, three tasks, one folder each. Plain HTML/CSS/vanilla JS — no
frameworks, no build step, no external libraries.

```
/index.html          landing page linking to all 3 tasks
/task1/               Exclusive Privileges section replica
/task2/               video carousel + chapters + chapter generator
/task3/               lead form 6s into video playback
/assets/task1/         drop extracted images here (see task1 notes)
```

## How to preview locally
No build step needed — but don't just double-click index.html, because the
YouTube IFrame API needs a real http(s) origin to load from. Easiest option:

```bash
cd intern-assignment
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploying to GitHub Pages
1. Create a new repo, push this folder's contents to it (root of the repo,
   not nested inside another folder).
2. Repo → Settings → Pages → Source: **Deploy from a branch** → `main` / `(root)`.
3. Your site will be live at `https://<username>.github.io/<repo-name>/`.

## Why each task is built the way it is

**Task 1 — Exclusive Privileges replica**
Rebuilt using real computed styles + DOM structure captured straight from the live page via Chrome DevTools (the container, heading, swiper padding, card size/radius/padding, and real background-image URLs are now exact — not estimated from a screenshot). The 3D coverflow itself is hand-rolled: the live page uses Swiper.js (not allowed here), so the per-slide `translate3d()/rotateY()` transform math was reverse-engineered directly from three real captured transform values into three constants (shift, depth, rotation-per-step), rather than guessing at a generic carousel.

**Task 2 — Video chapters**
Two components are built:
- A working carousel + chapter navigation for the 3 given videos, using the YouTube IFrame Player API so chapter buttons can call `seekTo()`. Only one `YT.Player` instance exists at a time (lite-embed pattern) to avoid loading three iframes/scripts up front.
- A prototype automated chapter generator. The generator segments a timestamped transcript using timing gaps and simple lexical signals, which is the same proxy signal caption-based chapter tools use. It tries live caption auto-fetch first and explains, in the UI, why that call gets blocked by CORS on a real domain.

**Task 3 — Lead form on video**
Uses the IFrame Player API instead of `setTimeout(6000)` on page load, because the brief means 6 seconds of *playback*, not 6 seconds after the page loads. The timer only accumulates while the player is actually in the `PLAYING` state, so pausing pauses the countdown too. The form slides in as a bottom panel rather than a full modal so it never blocks the video — that was the explicit "smooth experience" requirement in the brief.

## Notes
- **Task 1**: The replica replicates the design and layout of the "Exclusive Privileges" section.
- **Task 2**: Real chapter timestamps and labels have been integrated for all three videos.
- **Task 3**: The form mimics a real lead capture flow and fades out 2.5 seconds after a successful submission.


