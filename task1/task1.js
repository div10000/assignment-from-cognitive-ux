/* ============================================================
   Hand-rolled replica of Swiper's "coverflow" effect.

   Why hand-roll instead of approximating with a flat slide carousel
   (like the first pass of this file did): the captured DOM dump showed
   actual inline transform values per slide — translate3d(...) rotateY(...)
   — which only make sense for a true 3D coverflow, not a 2D slider. Since
   Swiper.js itself isn't allowed (no external libraries), this
   reverse-engineers the same math from those captured numbers:

     offset -1 → translate3d(92.973px, 0, -265.637px)  rotateY(-33.2046deg)
     offset  0 → translate3d(-0.07px,  0, -0.19px)      rotateY(0.024deg)
     offset +1 → translate3d(-92.878px,0, -265.367px)   rotateY(33.171deg)
     offset +2 → translate3d(-185.919,0, -531.197px)    rotateY(66.400deg)

   That's linear in offset for X/rotation, and linear in |offset| for Z —
   so three constants (SHIFT_X, DEPTH_Z, ROTATE_DEG) reproduce all of it.
   ============================================================ */

const SHIFT_X = 93;      // px of horizontal shift per step away from center
const DEPTH_Z = 265.5;   // px pushed back per step away from center
const ROTATE_DEG = 33.2; // degrees of Y-rotation per step away from center
const TRANSITION_MS = 1000; // exact captured transition-duration

const wrapper = document.getElementById("swiperWrapper");
const viewport = document.getElementById("swiperViewport");
const pagination = document.getElementById("swiperPagination");
const prevBtn = document.getElementById("swiperPrev");
const nextBtn = document.getElementById("swiperNext");

const slides = Array.from(wrapper.querySelectorAll(".swiper-slide"));
const N = slides.length;

// Matches the state captured in the DevTools dump: index 1 ("Activation
// voucher / Flat ₹1,200/- off") was the active slide when it was grabbed.
let activeIndex = 1;

function circularOffset(i, active, n) {
  let offset = i - active;
  if (offset > n / 2) offset -= n;
  if (offset < -n / 2) offset += n;
  return offset;
}

function applyTransforms() {
  slides.forEach((slideEl, i) => {
    const offset = circularOffset(i, activeIndex, N);
    const x = -SHIFT_X * offset;
    const z = -DEPTH_Z * Math.abs(offset);
    const rot = ROTATE_DEG * offset;

    slideEl.style.transform = `translate(-50%, -50%) translate3d(${x}px, 0, ${z}px) rotateY(${rot}deg)`;
    slideEl.style.zIndex = String(10 - Math.abs(offset));
  });

  [...pagination.children].forEach((dot, i) => dot.classList.toggle("active", i === activeIndex));
}

function buildPagination() {
  pagination.innerHTML = "";
  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "swiper-pagination-bullet" + (i === activeIndex ? " active" : "");
    dot.setAttribute("aria-label", `Go to offer ${i + 1}`);
    dot.addEventListener("click", () => goTo(i));
    pagination.appendChild(dot);
  });
}

function goTo(index) {
  activeIndex = ((index % N) + N) % N;
  applyTransforms();
}

prevBtn.addEventListener("click", () => goTo(activeIndex - 1));
nextBtn.addEventListener("click", () => goTo(activeIndex + 1));

// Basic touch swipe.
let touchStartX = null;
wrapper.addEventListener("touchstart", (e) => (touchStartX = e.touches[0].clientX), { passive: true });
wrapper.addEventListener(
  "touchend",
  (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) goTo(activeIndex + (dx < 0 ? 1 : -1));
    touchStartX = null;
  },
  { passive: true }
);

// Scale the whole 3D rig down on viewports narrower than the 720px
// design width, since we don't yet have a real mobile-breakpoint dump
// to know if the layout actually restructures instead of just shrinking.
function updateFanScale() {
  const designWidth = 720 - 32; // container minus its 16px+16px padding
  const available = viewport.clientWidth;
  const scale = Math.min(1, available / designWidth);
  wrapper.style.setProperty("--fan-scale", scale.toFixed(3));
}
window.addEventListener("resize", updateFanScale);

buildPagination();
applyTransforms();
updateFanScale();
