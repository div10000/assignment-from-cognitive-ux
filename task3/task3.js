/* ============================================================
   Task 3 — Lead form appears 6s into ACTUAL playback time.
   Why the YouTube IFrame Player API instead of a plain <iframe>+setTimeout:
   - A plain embed gives us no signal about play/pause/seek, so a naive
     setTimeout(6000) would fire even if the user paused at second 1.
   - The IFrame API's onStateChange event lets us start/stop a timer in
     sync with real PLAYING state, which is what the brief means by
     "6 seconds after the video is played".
   ============================================================ */

const VIDEO_ID = "RJTCAL1DRro";
const TRIGGER_AFTER_MS = 6000;
const STORAGE_KEY = "leadFormShown:" + VIDEO_ID;

let player = null;
let playTimer = null;
let elapsedPlayMs = 0;
let lastTickAt = 0;
let formAlreadyShown = sessionStorage.getItem(STORAGE_KEY) === "1";

// 1. Load the IFrame API script, then create the player once it's ready.
(function loadYouTubeApi() {
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
})();

// Required global callback name expected by the YouTube IFrame API.
window.onYouTubeIframeAPIReady = function () {
  player = new YT.Player("player-mount", {
    videoId: VIDEO_ID,
    playerVars: {
      rel: 0,
      modestbranding: 1,
      playsinline: 1,
    },
    events: {
      onStateChange: onPlayerStateChange,
    },
  });
};

function onPlayerStateChange(event) {
  if (formAlreadyShown) return;

  if (event.data === YT.PlayerState.PLAYING) {
    startPlayTimer();
  } else {
    // PAUSED, BUFFERING, ENDED, etc. — stop counting, but keep elapsed time.
    stopPlayTimer();
  }
}

function startPlayTimer() {
  if (playTimer) return; // already running
  lastTickAt = Date.now();
  playTimer = setInterval(() => {
    const now = Date.now();
    elapsedPlayMs += now - lastTickAt;
    lastTickAt = now;

    if (elapsedPlayMs >= TRIGGER_AFTER_MS) {
      showLeadForm();
      stopPlayTimer();
    }
  }, 250);
}

function stopPlayTimer() {
  if (playTimer) {
    clearInterval(playTimer);
    playTimer = null;
  }
}

function showLeadForm() {
  formAlreadyShown = true;
  sessionStorage.setItem(STORAGE_KEY, "1");
  const panel = document.getElementById("lead-form");
  panel.classList.add("visible");
  panel.setAttribute("aria-hidden", "false");
}

function hideLeadForm() {
  const panel = document.getElementById("lead-form");
  panel.classList.remove("visible");
  panel.setAttribute("aria-hidden", "true");
}

document.getElementById("lead-close").addEventListener("click", hideLeadForm);

// 2. Form validation + fake-submit (no backend in this assignment —
//    in production this would POST to a CRM/lead endpoint).
const form = document.getElementById("lead-capture-form");
form.addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("lead-name");
  const email = document.getElementById("lead-email");
  let valid = true;

  valid = validateField(name, name.value.trim().length >= 2, "Enter your full name.") && valid;
  valid = validateField(email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()), "Enter a valid email.") && valid;

  if (!valid) return;

  document.getElementById("lead-form-step").hidden = true;
  document.getElementById("lead-form-success").hidden = false;

  // Auto-collapse the panel a couple seconds after success so it never
  // permanently blocks the video.
  setTimeout(hideLeadForm, 2500);
});

function validateField(input, isValid, message) {
  const errorEl = document.querySelector(`.error[data-for="${input.name}"]`);
  if (!isValid) {
    if (errorEl) errorEl.textContent = message;
    input.setAttribute("aria-invalid", "true");
  } else {
    if (errorEl) errorEl.textContent = "";
    input.removeAttribute("aria-invalid");
  }
  return isValid;
}
