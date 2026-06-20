/* =========================================================================
   SAMSCALES — Home cinematic scroll experience
   GSAP + ScrollTrigger + canvas video frames (Lenis inited in site.js)
   ========================================================================= */
gsap.registerPlugin(ScrollTrigger);

const FRAME_COUNT = 192;
const FRAME_SPEED = 2.0;      // product/scene completes by ~50% scroll
const IMAGE_SCALE = 0.86;     // padded cover sweet spot
const framePath = (i) => `frames/frame_${String(i + 1).padStart(4, "0")}.webp`;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { alpha: false });
const canvasWrap = document.querySelector(".canvas-wrap");
const heroSection = document.querySelector(".hero-standalone");
const scrollContainer = document.getElementById("scroll-container");

const frames = new Array(FRAME_COUNT);
let currentFrame = 0;
let bgColor = "#0a0a0a";

/* ---------- Canvas sizing (devicePixelRatio aware) ---------- */
function sizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  drawFrame(currentFrame);
}

function sampleBgColor(img) {
  try {
    const c = document.createElement("canvas");
    c.width = c.height = 8;
    const cc = c.getContext("2d");
    cc.drawImage(img, 0, 0, 8, 8);
    const d = cc.getImageData(0, 0, 8, 8).data;
    let r = 0, g = 0, b = 0, n = 0;
    // sample the four corners
    [0, 7, 56, 63].forEach((p) => {
      r += d[p * 4]; g += d[p * 4 + 1]; b += d[p * 4 + 2]; n++;
    });
    bgColor = `rgb(${(r / n) | 0}, ${(g / n) | 0}, ${(b / n) | 0})`;
  } catch (_) {}
}

function drawFrame(index) {
  const img = frames[index];
  const cw = canvas.width, ch = canvas.height;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, cw, ch);
  if (!img) return;
  if (index % 20 === 0) sampleBgColor(img);
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const scale = Math.max(cw / iw, ch / ih) * IMAGE_SCALE;
  const dw = iw * scale, dh = ih * scale;
  const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

/* ---------- Two-phase frame preloader ---------- */
function loadImage(i) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => { frames[i] = img; res(); };
    img.onerror = () => res();
    img.src = framePath(i);
  });
}

async function preload() {
  const bar = document.getElementById("loader-bar");
  const pct = document.getElementById("loader-percent");
  let loaded = 0;
  const bump = () => {
    loaded++;
    const p = Math.round((loaded / FRAME_COUNT) * 100);
    if (bar) bar.style.width = p + "%";
    if (pct) pct.textContent = p + "%";
  };

  // phase 1: first 10 frames for instant first paint
  const FIRST = 10;
  for (let i = 0; i < FIRST; i++) { await loadImage(i); bump(); }
  sizeCanvas();
  if (frames[0]) { sampleBgColor(frames[0]); drawFrame(0); }

  // phase 2: rest in the background (batched)
  const rest = [];
  for (let i = FIRST; i < FRAME_COUNT; i++) rest.push(loadImage(i).then(bump));
  await Promise.all(rest);
}

/* ---------- Hero intro reveal ---------- */
function heroIntro() {
  const words = document.querySelectorAll(".hero-heading .word > span");
  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
  tl.from(".eyebrow", { y: 20, opacity: 0, duration: 0.8 })
    .from(words, { yPercent: 115, duration: 1.05, stagger: 0.09 }, "-=0.4")
    .from(".hero-standalone .hero-tagline", { y: 24, opacity: 0, duration: 0.9 }, "-=0.6")
    .from(".hero-standalone .hero-cta-row > *", { y: 22, opacity: 0, duration: 0.7, stagger: 0.12 }, "-=0.6")
    .from(".scroll-indicator", { opacity: 0, duration: 0.8 }, "-=0.3");
}

/* ---------- Circle-wipe hero reveal + frame binding ---------- */
function initScrollScene() {
  ScrollTrigger.create({
    trigger: scrollContainer,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      // frame playback
      const accel = Math.min(p * FRAME_SPEED, 1);
      const index = Math.min(Math.floor(accel * FRAME_COUNT), FRAME_COUNT - 1);
      if (index !== currentFrame) {
        currentFrame = index;
        requestAnimationFrame(() => drawFrame(currentFrame));
      }
      // hero fade + circle wipe
      if (heroSection) heroSection.style.opacity = Math.max(0, 1 - p * 16);
      const wipe = Math.min(1, Math.max(0, (p - 0.005) / 0.06));
      canvasWrap.style.clipPath = `circle(${wipe * 78}% at 50% 50%)`;
    },
  });
}

/* ---------- Section positioning + entrance animations ---------- */
const SECTION_META = []; // {el, tl, enter, leave, persist, active}

function buildSectionTimeline(section) {
  const type = section.dataset.animation;
  const children = section.querySelectorAll(
    ".section-label, .section-heading, .section-body, .section-note, .cta-button, .stat, .svc-card, .svc-preview-head"
  );
  const tl = gsap.timeline({ paused: true });
  switch (type) {
    case "slide-left":
      tl.from(children, { x: -90, opacity: 0, stagger: 0.13, duration: 0.9, ease: "power3.out" }); break;
    case "slide-right":
      tl.from(children, { x: 90, opacity: 0, stagger: 0.13, duration: 0.9, ease: "power3.out" }); break;
    case "scale-up":
      tl.from(children, { scale: 0.85, opacity: 0, stagger: 0.12, duration: 1.0, ease: "power2.out" }); break;
    case "clip-reveal":
      tl.from(children, { clipPath: "inset(100% 0 0 0)", opacity: 0, stagger: 0.15, duration: 1.1, ease: "power4.inOut" }); break;
    case "stagger-up":
      tl.from(children, { y: 64, opacity: 0, stagger: 0.14, duration: 0.85, ease: "power3.out" }); break;
    case "fade-up":
    default:
      tl.from(children, { y: 52, opacity: 0, stagger: 0.12, duration: 0.9, ease: "power3.out" }); break;
  }
  return tl;
}

function positionSections() {
  const H = scrollContainer.offsetHeight;
  const VH = window.innerHeight;
  document.querySelectorAll(".scroll-section").forEach((s) => {
    const enter = parseFloat(s.dataset.enter);
    const leave = parseFloat(s.dataset.leave);
    const mid = (enter + leave) / 200; // 0..1
    s.style.top = mid * (H - VH) + 0.5 * VH + "px";
  });
}

function initSections() {
  document.querySelectorAll(".scroll-section").forEach((s) => {
    SECTION_META.push({
      el: s,
      tl: buildSectionTimeline(s),
      enter: parseFloat(s.dataset.enter),
      leave: parseFloat(s.dataset.leave),
      persist: s.dataset.persist === "true",
      active: false,
    });
  });

  ScrollTrigger.create({
    trigger: scrollContainer,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress * 100;
      SECTION_META.forEach((m) => {
        const shouldShow = p >= m.enter - 1 && (m.persist || p <= m.leave + 2);
        if (shouldShow && !m.active) { m.active = true; m.tl.play(); }
        else if (!shouldShow && m.active) { m.active = false; m.tl.reverse(); }
      });
    },
  });
}

/* ---------- Counters ---------- */
function initCounters() {
  document.querySelectorAll(".stat-number").forEach((el) => {
    const target = parseFloat(el.dataset.value);
    const decimals = parseInt(el.dataset.decimals || "0");
    let done = false;
    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        if (!done && self.progress * 100 >= 57) {
          done = true;
          gsap.fromTo(el, { textContent: 0 }, {
            textContent: target, duration: 1.8, ease: "power1.out",
            snap: { textContent: decimals === 0 ? 1 : 0.1 },
            onUpdate() {
              el.textContent = decimals === 0
                ? Math.round(el.textContent)
                : parseFloat(el.textContent).toFixed(decimals);
            },
          });
        }
      },
    });
  });
}

/* ---------- Dark overlay (stats) ---------- */
function initDarkOverlay(enter, leave) {
  const overlay = document.getElementById("dark-overlay");
  const fade = 0.04;
  const e = enter / 100, l = leave / 100;
  ScrollTrigger.create({
    trigger: scrollContainer, start: "top top", end: "bottom bottom", scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      let o = 0;
      if (p >= e - fade && p <= e) o = ((p - (e - fade)) / fade) * 0.92;
      else if (p > e && p < l) o = 0.92;
      else if (p >= l && p <= l + fade) o = 0.92 * (1 - (p - l) / fade);
      overlay.style.opacity = o;
    },
  });
}

/* ---------- Marquee ---------- */
function initMarquee() {
  document.querySelectorAll(".marquee-wrap").forEach((el) => {
    const speed = parseFloat(el.dataset.scrollSpeed) || -28;
    const showEnter = parseFloat(el.dataset.show) || 36;
    const showLeave = parseFloat(el.dataset.hide) || 58;
    gsap.to(el.querySelector(".marquee-text"), {
      xPercent: speed, ease: "none",
      scrollTrigger: { trigger: scrollContainer, start: "top top", end: "bottom bottom", scrub: true },
    });
    const e = showEnter / 100, l = showLeave / 100, fade = 0.05;
    ScrollTrigger.create({
      trigger: scrollContainer, start: "top top", end: "bottom bottom", scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        let o = 0;
        if (p >= e - fade && p <= e) o = (p - (e - fade)) / fade;
        else if (p > e && p < l) o = 1;
        else if (p >= l && p <= l + fade) o = 1 - (p - l) / fade;
        el.style.opacity = o;
      },
    });
  });
}

/* ---------- Boot ---------- */
(async function () {
  scrollContainer.style.height = window.matchMedia("(max-width: 768px)").matches ? "650vh" : "920vh";

  await preload();

  // hide loader
  const loader = document.getElementById("loader");
  if (loader) loader.classList.add("hidden");
  document.body.style.overflow = "";

  heroIntro();
  initScrollScene();
  positionSections();
  initSections();
  initCounters();
  initDarkOverlay(56, 73);
  initMarquee();

  window.addEventListener("resize", () => { sizeCanvas(); positionSections(); ScrollTrigger.refresh(); });
  setTimeout(() => ScrollTrigger.refresh(), 400);
})();
