/* ============================================================
   PART A — Carousel + chapters for the 3 fixed videos
   ============================================================ */

const VIDEOS = [
  {
    id: "RJTCAL1DRro",
    title: "In That Quiet Earth",
    chapters: [
      { time: 0, label: "Introduction & Vision" },
      { time: 10, label: "Warm & Nature-Inspired Design" },
      { time: 20, label: "Handcrafted Natural Materials" },
      { time: 36, label: "Unique Warmth vs. High-Rise" },
      { time: 45, label: "Every Home with its Own Garden" },
      { time: 53, label: "Total Environment Philosophy" },
    ],
  },
  {
    id: "jj_aUFX8SV8",
    title: "After the Rain",
    chapters: [
      { time: 0, label: "Designing Spaces for Nature" },
      { time: 14, label: "Homes with Private Gardens" },
      { time: 23, label: "Earth-Sheltered Green Roofs" },
      { time: 37, label: "Natural Climate Control" },
      { time: 49, label: "Craftsmanship & Natural Materials" },
      { time: 72, label: "Homes Designed for You" },
    ],
  },
  {
    id: "xmmxkmVSiq0",
    title: "Learning To Fly",
    chapters: [
      { time: 0, label: "Homes Designed Around You" },
      { time: 10, label: "Handcrafted & Customized Spaces" },
      { time: 22, label: "Natural Materials & Wire-Cut Bricks" },
      { time: 35, label: "Elevated Homes with Private Gardens" },
      { time: 45, label: "Villa Benefits & High-Rise Security" },
      { time: 50, label: "Philosophy of Living" },
    ],
  },
];

const track = document.getElementById("carouselTrack");
const dotsWrap = document.getElementById("dots");
const chaptersTitle = document.getElementById("chaptersTitle");
const chaptersList = document.getElementById("chaptersList");

let activeIndex = 0;
let activePlayer = null; // the single live YT.Player instance
let apiReady = false;
const apiReadyQueue = [];

window.onYouTubeIframeAPIReady = function () {
  apiReady = true;
  apiReadyQueue.forEach((fn) => fn());
  apiReadyQueue.length = 0;
};

(function loadYouTubeApi() {
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
})();

function playIconSvg() {
  return '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
}

function buildSlide(video, index) {
  const slide = document.createElement("div");
  slide.className = "slide";
  slide.dataset.index = index;
  slide.innerHTML = `
    <button class="thumb-btn" style="background-image:url('https://img.youtube.com/vi/${video.id}/hqdefault.jpg')" aria-label="Play ${video.title}"></button>
    <span class="play-icon">${playIconSvg()}</span>
    <span class="slide-title">${video.title}</span>
    <div class="player-container" id="container-${index}">
      <div class="player-mount" id="mount-${index}"></div>
    </div>
  `;
  slide.querySelector(".thumb-btn").addEventListener("click", () => playSlide(index));
  return slide;
}

function renderCarousel() {
  track.innerHTML = "";
  VIDEOS.forEach((v, i) => track.appendChild(buildSlide(v, i)));

  dotsWrap.innerHTML = "";
  VIDEOS.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "dot" + (i === 0 ? " active" : "");
    dot.setAttribute("aria-label", "Go to video " + (i + 1));
    dot.addEventListener("click", () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  renderChapters(0);
}

function goTo(index) {
  activeIndex = (index + VIDEOS.length) % VIDEOS.length;
  track.style.transform = `translateX(-${activeIndex * 100}%)`;
  [...dotsWrap.children].forEach((d, i) => d.classList.toggle("active", i === activeIndex));
  renderChapters(activeIndex);
}

document.getElementById("prevBtn").addEventListener("click", () => goTo(activeIndex - 1));
document.getElementById("nextBtn").addEventListener("click", () => goTo(activeIndex + 1));

function renderChapters(index) {
  const video = VIDEOS[index];
  chaptersTitle.textContent = `Chapters — ${video.title}`;
  chaptersList.innerHTML = "";
  video.chapters.forEach((ch) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.innerHTML = `<span class="ts">${formatTime(ch.time)}</span><span>${ch.label}</span>`;
    btn.addEventListener("click", () => jumpToChapter(index, ch.time));
    li.appendChild(btn);
    chaptersList.appendChild(li);
  });
}

function jumpToChapter(index, seconds) {
  // If this slide isn't already playing, start it, then seek once ready.
  if (index !== activeIndex || !document.querySelector(`.slide[data-index="${index}"]`).classList.contains("is-playing")) {
    goTo(index);
    playSlide(index, seconds);
    return;
  }
  if (activePlayer && activePlayer.seekTo) {
    activePlayer.seekTo(seconds, true);
    activePlayer.playVideo();
  }
}

function playSlide(index, startSeconds) {
  goTo(index);
  const slide = document.querySelector(`.slide[data-index="${index}"]`);
  slide.classList.add("is-playing");

  const mountFor = () => {
    if (activePlayer && activePlayer.destroy) {
      activePlayer.destroy();
      activePlayer = null;
    }
    // Recreate mount element to ensure robust mounting behavior after destruction
    const container = document.getElementById(`container-${index}`);
    if (container) {
      container.innerHTML = `<div class="player-mount" id="mount-${index}"></div>`;
    }
    activePlayer = new YT.Player(`mount-${index}`, {
      videoId: VIDEOS[index].id,
      playerVars: { autoplay: 1, rel: 0, playsinline: 1, start: startSeconds || 0 },
      events: {},
    });
  };

  if (apiReady) mountFor();
  else apiReadyQueue.push(mountFor);
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

renderCarousel();

/* ============================================================
   PART B — Automated chapter generator (prototype)

   Design notes (why it's built this way, and what it deliberately
   does NOT attempt):

   1. Real "watch the video and understand it" chapter detection needs
      either (a) an LLM reading the transcript, or (b) a trained video/audio
      model. Both need a server to hold an API key — the assignment scopes
      this to HTML/CSS/JS with no external libraries and no backend, so
      neither is in-bounds here.

   2. What IS legitimately doable client-side: segmenting an existing
      timestamped transcript using timing + lexical signals. That's what
      this does. It's a heuristic, not true topic understanding — it
      finds *plausible* boundaries (silence gaps, pacing changes, where
      vocabulary shifts), the same proxy signal most caption-based chapter
      tools use before any AI layer is added on top.

   3. Auto-fetching captions straight from YouTube in the browser is
      attempted first, but YouTube's caption endpoints don't send
      Access-Control-Allow-Origin headers for arbitrary origins, so the
      browser will block the response (CORS). That's not a bug in this
      code — it's why every production "auto chapters" tool runs the
      fetch on a server, not the client. The manual transcript box is the
      honest fallback given the no-backend constraint.
   ============================================================ */

const STOPWORDS = new Set(
  "the a an and or but if then so to of in on for with is are was were be been being this that it its as at by from your you i we they he she them our".split(" ")
);

function extractVideoId(url) {
  const m = url.match(/(?:v=|youtu\.be\/|\/embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

document.getElementById("genFetchBtn").addEventListener("click", async () => {
  const url = document.getElementById("genUrl").value.trim();
  const status = document.getElementById("genStatus");
  const id = extractVideoId(url);

  if (!id) {
    status.textContent = "That doesn't look like a YouTube URL — couldn't find an 11-character video ID.";
    return;
  }

  status.textContent = "Trying to fetch captions directly from YouTube…";
  try {
    const res = await fetch(`https://video.google.com/timedtext?lang=en&v=${id}`);
    if (!res.ok) throw new Error("Non-OK response");
    const xml = await res.text();
    if (!xml || xml.indexOf("<text") === -1) throw new Error("No caption track returned");

    const lines = [...xml.matchAll(/<text start="([\d.]+)"[^>]*>([^<]*)<\/text>/g)].map((m) => ({
      start: parseFloat(m[1]),
      text: decodeHtmlEntities(m[2]),
    }));
    document.getElementById("genTranscript").value = lines
      .map((l) => `${formatHMS(l.start)} ${l.text}`)
      .join("\n");
    status.textContent = `Fetched ${lines.length} caption lines automatically.`;
  } catch (err) {
    status.textContent =
      "Blocked, as expected (CORS) — this is the backend-required step described above. Paste a transcript below instead, or copy one from YouTube's \"Show transcript\" panel.";
  }
});

document.getElementById("genRunBtn").addEventListener("click", () => {
  const raw = document.getElementById("genTranscript").value;
  const parsed = parseTranscript(raw);
  if (parsed.length === 0) {
    alert("Paste a transcript first (or fetch captions above).");
    return;
  }
  const chapters = segmentIntoChapters(parsed);
  renderGenResult(chapters);
});

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<");
}

function formatHMS(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Accepts lines like "00:01:23 some caption text" (HH:MM:SS or MM:SS).
function parseTranscript(raw) {
  const lineRe = /^(\d{1,2}:\d{2}(?::\d{2})?)\s+(.*)$/;
  const out = [];
  raw.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const m = trimmed.match(lineRe);
    if (!m) return;
    out.push({ start: parseTimecode(m[1]), text: m[2] });
  });
  return out;
}

function parseTimecode(tc) {
  const parts = tc.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return parts[0] * 60 + parts[1];
}

/* Heuristic boundary detection:
   - Compute gaps between consecutive caption start times.
   - A gap notably larger than the median gap is a likely pause/scene change.
   - Cap chapter length so one giant unbroken stretch still gets split
     (every ~75s) — long unbroken narration still has implicit beats. */
function segmentIntoChapters(lines) {
  if (lines.length < 2) return [{ time: 0, label: "Full video" }];

  const gaps = [];
  for (let i = 1; i < lines.length; i++) gaps.push(lines[i].start - lines[i - 1].start);
  const sortedGaps = [...gaps].sort((a, b) => a - b);
  const medianGap = sortedGaps[Math.floor(sortedGaps.length / 2)] || 1;
  const gapThreshold = Math.max(medianGap * 2.5, 1.5);
  const MAX_CHAPTER_LEN = 75;

  const boundaries = [0];
  let lastBoundaryTime = lines[0].start;
  for (let i = 1; i < lines.length; i++) {
    const gap = lines[i].start - lines[i - 1].start;
    const sinceLastBoundary = lines[i].start - lastBoundaryTime;
    if (gap >= gapThreshold || sinceLastBoundary >= MAX_CHAPTER_LEN) {
      boundaries.push(i);
      lastBoundaryTime = lines[i].start;
    }
  }

  // Build chapters from boundaries, generating a title from each segment's
  // most distinctive words (simple TF, stopwords removed).
  const chapters = boundaries.map((startIdx, bi) => {
    const endIdx = bi + 1 < boundaries.length ? boundaries[bi + 1] : lines.length;
    const segment = lines.slice(startIdx, endIdx);
    return {
      time: Math.round(segment[0].start),
      label: titleFromSegment(segment),
    };
  });

  // Merge any chapter shorter than 8s into the previous one — too small
  // to be a meaningful navigation point.
  const merged = [];
  chapters.forEach((ch) => {
    const prev = merged[merged.length - 1];
    if (prev && ch.time - prev.time < 8) return;
    merged.push(ch);
  });
  if (merged.length === 0 || merged[0].time !== 0) merged.unshift({ time: 0, label: "Introduction" });
  return merged;
}

function titleFromSegment(segment) {
  const freq = {};
  segment.forEach((line) => {
    line.text
      .toLowerCase()
      .replace(/[^a-z0-9\s']/g, " ")
      .split(/\s+/)
      .forEach((word) => {
        if (word.length < 3 || STOPWORDS.has(word)) return;
        freq[word] = (freq[word] || 0) + 1;
      });
  });
  const top = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([w]) => w[0].toUpperCase() + w.slice(1));

  return top.length ? top.join(" & ") : "Segment";
}

function renderGenResult(chapters) {
  const wrap = document.getElementById("genResult");
  const list = document.getElementById("genChapterList");
  const code = document.getElementById("genCode");

  wrap.hidden = false;
  list.innerHTML = "";
  chapters.forEach((ch) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="ts">${formatTime(ch.time)}</span><span>${ch.label}</span>`;
    list.appendChild(li);
  });

  const jsArray = chapters.map((ch) => `      { time: ${ch.time}, label: "${ch.label}" },`).join("\n");
  const descLines = chapters.map((ch) => `${formatTime(ch.time)} ${ch.label}`).join("\n");
  code.textContent = `// Paste into VIDEOS[i].chapters in task2.js\n[\n${jsArray}\n]\n\n// Or paste into a YouTube video description for native chapters:\n${descLines}`;
}

document.getElementById("genCopyBtn").addEventListener("click", () => {
  navigator.clipboard.writeText(document.getElementById("genCode").textContent).then(() => {
    const btn = document.getElementById("genCopyBtn");
    const original = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = original), 1200);
  });
});
