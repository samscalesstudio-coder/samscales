/* =========================================================================
   SAMSCALES — shared site script
   - SHOP config (SINGLE SOURCE OF TRUTH for all contact details)
   - Lenis smooth scroll, nav, mobile menu, 3D tilt, reveals, Three.js accent
   ========================================================================= */

/* -------------------------------------------------------------------------
   SHOP CONFIG  —  EDIT CONTACT DETAILS HERE ONLY
   ------------------------------------------------------------------------- */
const SHOP = {
  name: "Samscales Barber Shop",
  est: "2026",
  tagline: "Sharp Cuts. Clean Fades.",

  // ✅ confirmed by owner
  phoneDisplay: "+91 76588 70807",
  phoneHref: "+917658870807",
  whatsapp: "917658870807",          // wa.me format, no +
  email: "samscalesstudio@gmail.com",
  instagram: "https://www.instagram.com/sam__scales_/",
  instagramHandle: "@sam__scales_",

  // ✅ map pin confirmed by owner (Google Maps "Sam Scales")
  mapsUrl: "https://maps.app.goo.gl/iYSwW9HPQfbDt23k9",
  directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=31.8104643%2C75.646905",

  // ✅ location from map pin (reverse-geocoded). Map/Directions buttons hit the exact spot.
  addressLines: ["Sam Scales Barber Shop", "Dasuya, Hoshiarpur", "Punjab 144205, India"],

  ownerName: "Sam",   // ✅ confirmed by owner

  // ✅ Open 8 AM – 10 PM daily (owner). Closed only on the last Tuesday of the month.
  hours: [
    { day: "Monday",    hours: "8:00 AM – 10:00 PM" },
    { day: "Tuesday",   hours: "8:00 AM – 10:00 PM" },
    { day: "Wednesday", hours: "8:00 AM – 10:00 PM" },
    { day: "Thursday",  hours: "8:00 AM – 10:00 PM" },
    { day: "Friday",    hours: "8:00 AM – 10:00 PM" },
    { day: "Saturday",  hours: "8:00 AM – 10:00 PM" },
    { day: "Sunday",    hours: "8:00 AM – 10:00 PM" },
  ],
  closedRule: "Closed on the last Tuesday of the month",
};

const waLink = (msg) =>
  `https://wa.me/${SHOP.whatsapp}${msg ? "?text=" + encodeURIComponent(msg) : ""}`;

/* -------------------------------------------------------------------------
   Populate DOM from SHOP config
   ------------------------------------------------------------------------- */
function hydrateShop() {
  const set = (sel, fn) => document.querySelectorAll(sel).forEach(fn);

  set('[data-shop="phone"]', (el) => (el.textContent = SHOP.phoneDisplay));
  set('[data-shop="phone-link"]', (el) => {
    el.href = "tel:" + SHOP.phoneHref;
    if (!el.dataset.keepText) el.textContent = SHOP.phoneDisplay;
  });
  set('[data-shop="email"]', (el) => (el.textContent = SHOP.email));
  set('[data-shop="email-link"]', (el) => {
    el.href = "mailto:" + SHOP.email;
    if (!el.dataset.keepText) el.textContent = SHOP.email;
  });
  set('[data-shop="instagram-link"]', (el) => (el.href = SHOP.instagram));
  set('[data-shop="instagram"]', (el) => (el.textContent = SHOP.instagramHandle));
  set('[data-shop="maps-link"]', (el) => (el.href = SHOP.mapsUrl));
  set('[data-shop="directions-link"]', (el) => {
    el.href = SHOP.directionsUrl;
    el.target = "_blank";
    el.rel = "noopener";
  });
  set('[data-shop="address"]', (el) => (el.innerHTML = SHOP.addressLines.join("<br>")));
  set('[data-shop="owner"]', (el) => (el.textContent = SHOP.ownerName));
  set('[data-shop="year"]', (el) => (el.textContent = new Date().getFullYear()));

  // WhatsApp links (optionally read a data-wa-msg attribute for a prefilled message)
  set('[data-shop="whatsapp-link"]', (el) => {
    el.href = waLink(el.dataset.waMsg || "");
    el.target = "_blank";
    el.rel = "noopener";
  });

  // Opening hours table
  document.querySelectorAll("[data-shop='hours']").forEach((hoursHost) => {
    const now = new Date();
    const todayIdx = (now.getDay() + 6) % 7; // 0=Mon
    // is today the last Tuesday of the month? (Tue + no more Tuesdays this month)
    const isLastTue =
      now.getDay() === 2 &&
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).getMonth() !== now.getMonth();

    const rows = SHOP.hours
      .map((h, i) => {
        const isToday = i === todayIdx;
        const closedToday = isToday && h.day === "Tuesday" && isLastTue;
        const closed = h.closed || closedToday;
        const cls = ["hours-row", closed ? "closed" : "", isToday ? "today" : ""].filter(Boolean).join(" ");
        const hrs = closedToday ? "Closed today" : h.hours;
        return `<div class="${cls}"><span class="day">${h.day}${isToday ? " · Today" : ""}</span><span class="hrs">${hrs}</span></div>`;
      })
      .join("");
    const note = SHOP.closedRule ? `<div class="hours-note">${SHOP.closedRule}</div>` : "";
    hoursHost.innerHTML = rows + note;
  });
}

/* -------------------------------------------------------------------------
   Header scroll state + mobile menu + active link
   ------------------------------------------------------------------------- */
function initNav() {
  const header = document.querySelector(".site-header");
  const onScroll = () => header && header.classList.toggle("scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const toggle = document.querySelector(".nav-toggle");
  toggle &&
    toggle.addEventListener("click", () => {
      document.body.classList.toggle("menu-open");
      const open = document.body.classList.contains("menu-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  document.querySelectorAll(".nav-links a").forEach((a) =>
    a.addEventListener("click", () => document.body.classList.remove("menu-open"))
  );

  // active link
  const page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".nav-links a").forEach((a) => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (href === page || (page === "" && href === "index.html")) a.classList.add("active");
  });
}

/* -------------------------------------------------------------------------
   Lenis smooth scroll (shared). Integrates with GSAP ScrollTrigger if loaded.
   ------------------------------------------------------------------------- */
function initLenis() {
  if (typeof Lenis === "undefined") return null;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  // Skip Lenis on touch / small screens — phones scroll smoothly natively and
  // Lenis can interfere with touch scrolling (incl. inside the booking modal).
  if (window.matchMedia("(hover: none), (pointer: coarse), (max-width: 900px)").matches) return null;

  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  window.__lenis = lenis;

  if (window.gsap && window.ScrollTrigger) {
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = (t) => {
      lenis.raf(t);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }
  return lenis;
}

/* -------------------------------------------------------------------------
   Scroll reveals (IntersectionObserver) — for inner pages
   ------------------------------------------------------------------------- */
function initReveals() {
  const els = document.querySelectorAll("[data-reveal]");
  if (!els.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const delay = parseFloat(e.target.dataset.delay || "0");
          e.target.style.transitionDelay = delay + "s";
          e.target.classList.add("reveal-in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
  );
  els.forEach((el) => io.observe(el));
}

/* -------------------------------------------------------------------------
   3D tilt cards (preserve-3d). Pointer only; skipped on touch / small screens.
   ------------------------------------------------------------------------- */
function initTilt() {
  if (window.matchMedia("(hover: none), (max-width: 768px)").matches) return;
  const MAX = 9;
  document.querySelectorAll(".card3d").forEach((card) => {
    let raf = null;
    const move = (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rx = (0.5 - py) * MAX;
      const ry = (px - 0.5) * MAX;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
        card.style.setProperty("--mx", px * 100 + "%");
        card.style.setProperty("--my", py * 100 + "%");
      });
    };
    const reset = () => {
      if (raf) cancelAnimationFrame(raf);
      card.style.transform = "";
    };
    card.addEventListener("pointermove", move);
    card.addEventListener("pointerleave", reset);
  });
}

/* -------------------------------------------------------------------------
   Three.js floating-metal accent (gold + silver geometric forms)
   ------------------------------------------------------------------------- */
function initThreeAccent(canvas) {
  if (typeof THREE === "undefined" || !canvas) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const host = canvas.parentElement;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.z = 9;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  const mobile = window.matchMedia("(max-width: 768px)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.4 : 2));

  // lighting — hemisphere fill so metals read even without an env map
  scene.add(new THREE.HemisphereLight(0xfff3df, 0x140f0b, 1.0));
  scene.add(new THREE.AmbientLight(0x4a4036, 0.8));
  const key = new THREE.DirectionalLight(0xfff0d8, 2.6);
  key.position.set(5, 6, 7);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xd4b57a, 1.4);
  fill.position.set(-4, 2, 5);
  scene.add(fill);
  const rim = new THREE.PointLight(0xffd9a0, 3.0, 40);
  rim.position.set(6, -3, 4);
  scene.add(rim);

  const gold = new THREE.MeshStandardMaterial({ color: 0xb89456, metalness: 1, roughness: 0.3 });
  const silver = new THREE.MeshStandardMaterial({ color: 0xe8e6e1, metalness: 0.55, roughness: 0.32 });
  const wire = new THREE.MeshStandardMaterial({ color: 0xd4b57a, metalness: 0.8, roughness: 0.4, wireframe: true });

  const objs = [];
  const add = (geo, mat, pos, scale) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos);
    m.scale.setScalar(scale);
    m.userData.spin = (Math.random() - 0.5) * 0.004 + 0.002;
    m.userData.spin2 = (Math.random() - 0.5) * 0.004;
    scene.add(m);
    objs.push(m);
    return m;
  };

  // all objects kept to the RIGHT half so they never overlap left/side-aligned text
  add(new THREE.TorusKnotGeometry(1, 0.32, 140, 18), gold, [3.3, 0.7, 0], 1.0);
  add(new THREE.IcosahedronGeometry(1, 0), silver, [5.0, -1.7, -1], 1.05);
  add(new THREE.OctahedronGeometry(1, 0), wire, [2.6, 2.2, 0.4], 0.85);
  if (!mobile) add(new THREE.TorusGeometry(0.7, 0.22, 24, 60), gold, [5.6, 0.6, -1.6], 0.8);

  let mx = 0, my = 0, tx = 0, ty = 0;
  window.addEventListener("pointermove", (e) => {
    tx = (e.clientX / window.innerWidth - 0.5);
    ty = (e.clientY / window.innerHeight - 0.5);
  });

  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize", resize);

  let running = true;
  const io = new IntersectionObserver((ents) => (running = ents[0].isIntersecting), { threshold: 0 });
  io.observe(host);

  const tick = () => {
    requestAnimationFrame(tick);
    if (!running) return;
    mx += (tx - mx) * 0.05;
    my += (ty - my) * 0.05;
    objs.forEach((o) => {
      o.rotation.x += o.userData.spin;
      o.rotation.y += o.userData.spin2 + 0.003;
    });
    scene.rotation.y = mx * 0.5;
    scene.rotation.x = my * 0.3;
    renderer.render(scene, camera);
  };
  tick();
}

/* -------------------------------------------------------------------------
   Booking — form, modal, validation, confirmation ("bouquet") + WhatsApp send
   ------------------------------------------------------------------------- */
const BK_SERVICES = [
  "Signature Cut", "Skin Fade", "Beard Sculpt & Line-up",
  "Hot-Towel Shave", "Cut + Beard Combo", "Kids' Cut (5+)", "Not sure yet",
];
const BK_TIMES = ["Flexible", "Morning (10–12)", "Afternoon (12–4)",
  "Evening (4–7)", "Night (7–9)", "10:00", "11:00", "12:00", "13:00", "14:00",
  "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"];

const bouquetSVG = `
<svg viewBox="0 0 64 64" fill="none" stroke="#D4B57A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M32 58V36"/>
  <path d="M32 52c-7-3-11-9-11-16"/>
  <path d="M32 52c7-3 11-9 11-16"/>
  <path d="M25 50h14l-2.5 9h-9z"/>
  <circle cx="32" cy="18" r="6.5"/><circle cx="20" cy="27" r="5.5"/><circle cx="44" cy="27" r="5.5"/>
  <path d="M32 11.5v13M25.5 18h13M20 21.5v11M14.5 27h11M44 21.5v11M38.5 27h11"/>
</svg>`;

function bkUI() {
  const opts = (arr) => arr.map((o) => `<option>${o}</option>`).join("");
  const today = new Date().toISOString().split("T")[0];
  return `
  <div class="bk-ui">
    <div class="bk-form-wrap">
      <form class="bk-form" novalidate>
        <div class="bk-field">
          <span>Service</span>
          <select class="bk-input" name="service" required>
            <option value="" disabled selected>Choose a service</option>${opts(BK_SERVICES)}
          </select>
        </div>
        <div class="bk-row two">
          <label class="bk-field"><span>Full name *</span><input class="bk-input" name="name" autocomplete="name" required placeholder="Your name"></label>
          <label class="bk-field"><span>Phone number *</span><input class="bk-input" name="phone" type="tel" inputmode="tel" autocomplete="tel" required placeholder="10-digit mobile"></label>
        </div>
        <div class="bk-row two">
          <label class="bk-field"><span>Email <em>(optional)</em></span><input class="bk-input" name="email" type="email" autocomplete="email" placeholder="you@email.com"></label>
          <label class="bk-field"><span>Preferred date</span><input class="bk-input" name="date" type="date" min="${today}"></label>
        </div>
        <div class="bk-row two">
          <label class="bk-field"><span>Preferred time</span><select class="bk-input" name="time">${opts(BK_TIMES)}</select></label>
          <label class="bk-field"><span>Preferred barber <em>(optional)</em></span><input class="bk-input" name="barber" placeholder="No preference"></label>
        </div>
        <label class="bk-field"><span>Special request <em>(optional)</em></span><textarea class="bk-input" name="notes" rows="3" placeholder="Anything we should know — a reference style, allergies (product, fragrance, latex), etc."></textarea></label>
        <div class="bk-error" hidden></div>
        <button type="submit" class="btn btn-lg bk-submit">Request Appointment</button>
        <p class="bk-fineprint">Walk-ins welcome — booked clients are seen first. We'll confirm your slot by phone or WhatsApp.</p>
      </form>
    </div>
    <div class="bk-confirm">
      <canvas class="bk-confetti"></canvas>
      <div class="bk-seal">${bouquetSVG}</div>
      <h3>You're almost in the chair.</h3>
      <p class="sub">Here's your request. Send it to us in one tap — we'll confirm your slot by WhatsApp or a quick call.</p>
      <div class="bk-summary"></div>
      <div class="bk-confirm-actions">
        <a class="btn btn-lg bk-confirm-wa" target="_blank" rel="noopener" href="#">Confirm on WhatsApp</a>
        <a class="btn btn-ghost bk-confirm-call" href="#">Call the shop instead</a>
        <button type="button" class="btn btn-ghost bk-confirm-reset">Make another booking</button>
      </div>
      <p class="bk-confirm-note">Your request reaches us when you tap “Confirm on WhatsApp”.</p>
    </div>
  </div>`;
}

let bkModal = null;
function openBooking(service) {
  if (!bkModal) return;
  resetBookingUI(bkModal);
  if (service) {
    const sel = bkModal.querySelector('select[name="service"]');
    if (sel && [...sel.options].some((o) => o.value === service || o.text === service)) sel.value = service;
  }
  bkModal.classList.add("open");
  document.body.classList.add("bk-open");
  if (window.__lenis) window.__lenis.stop();
  setTimeout(() => bkModal.querySelector('input[name="name"]').focus(), 350);
}
function closeBooking() {
  if (!bkModal) return;
  bkModal.classList.remove("open");
  document.body.classList.remove("bk-open");
  if (window.__lenis) window.__lenis.start();
}
function resetBookingUI(scope) {
  const form = scope.querySelector(".bk-form");
  form && form.reset();
  scope.querySelector(".bk-form-wrap").classList.remove("hide");
  scope.querySelector(".bk-confirm").classList.remove("show");
  const err = scope.querySelector(".bk-error");
  if (err) { err.hidden = true; err.textContent = ""; }
  scope.querySelectorAll(".invalid").forEach((e) => e.classList.remove("invalid"));
}

function confetti(canvas) {
  if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const ctx = canvas.getContext("2d");
  const rect = canvas.parentElement.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const W = rect.width, H = rect.height;
  const colors = ["#D4B57A", "#B89456", "#E8E6E1", "#FAF7F1"];
  const N = 90;
  const parts = Array.from({ length: N }, () => ({
    x: W / 2 + (Math.random() - 0.5) * 80,
    y: H * 0.28,
    vx: (Math.random() - 0.5) * 9,
    vy: Math.random() * -9 - 4,
    g: 0.28 + Math.random() * 0.12,
    s: 4 + Math.random() * 5,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    c: colors[(Math.random() * colors.length) | 0],
    life: 0,
  }));
  let frame = 0;
  const max = 150;
  (function tick() {
    frame++;
    ctx.clearRect(0, 0, W, H);
    parts.forEach((p) => {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life++;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - frame / max);
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
      ctx.restore();
    });
    if (frame < max) requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, W, H);
  })();
}

function initBooking() {
  // build modal once
  const modal = document.createElement("div");
  modal.className = "bk-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", "Book an appointment");
  modal.innerHTML = `
    <div class="bk-dialog" data-lenis-prevent>
      <button class="bk-close" aria-label="Close booking"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      <div class="bk-dialog-head"><h3>Book a chair</h3><p>Tell us who you are and when suits — we'll confirm your slot.</p></div>
      ${bkUI()}
    </div>`;
  document.body.appendChild(modal);
  bkModal = modal;

  modal.addEventListener("click", (e) => { if (e.target === modal) closeBooking(); });
  modal.querySelector(".bk-close").addEventListener("click", closeBooking);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeBooking(); });

  // inline form on the Booking page
  const mount = document.getElementById("booking-form-mount");
  if (mount) mount.innerHTML = bkUI();

  // triggers: explicit [data-book]/[data-book-service], or any service card
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-book-service], [data-book]");
    if (t) {
      e.preventDefault();
      openBooking(t.getAttribute("data-book-service") || "");
      return;
    }
    const card = e.target.closest(".card3d");
    const cue = card && card.querySelector("[data-book-service]");
    if (cue) { e.preventDefault(); openBooking(cue.getAttribute("data-book-service")); }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const cue = e.target.closest && e.target.closest("[data-book-service]");
    if (cue) { e.preventDefault(); openBooking(cue.getAttribute("data-book-service")); }
  });

  // submit (delegated) + confirm reset
  document.addEventListener("submit", (e) => {
    const form = e.target.closest(".bk-form");
    if (!form) return;
    e.preventDefault();
    handleBookingSubmit(form);
  });
  document.addEventListener("click", (e) => {
    if (e.target.closest(".bk-confirm-reset")) {
      const scope = e.target.closest(".bk-ui");
      resetBookingUI(scope);
    }
  });
}

function handleBookingSubmit(form) {
  const scope = form.closest(".bk-ui");
  const data = Object.fromEntries(new FormData(form).entries());
  const err = scope.querySelector(".bk-error");
  scope.querySelectorAll(".invalid").forEach((e) => e.classList.remove("invalid"));

  const problems = [];
  if (!data.service) { problems.push("Please choose a service."); form.querySelector('[name="service"]').classList.add("invalid"); }
  if (!data.name || !data.name.trim()) { problems.push("Please add your name."); form.querySelector('[name="name"]').classList.add("invalid"); }
  const digits = (data.phone || "").replace(/\D/g, "");
  if (digits.length < 10) { problems.push("Please add a valid phone number."); form.querySelector('[name="phone"]').classList.add("invalid"); }
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) { problems.push("That email doesn't look right."); form.querySelector('[name="email"]').classList.add("invalid"); }

  if (problems.length) {
    err.innerHTML = problems.join("<br>");
    err.hidden = false;
    form.querySelector(".invalid")?.focus();
    return;
  }
  err.hidden = true;

  const fmtDate = data.date ? new Date(data.date + "T00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) : "Flexible";
  const rows = [
    ["Service", data.service],
    ["Name", data.name.trim()],
    ["Phone", data.phone.trim()],
    data.email ? ["Email", data.email.trim()] : null,
    ["Date", fmtDate],
    ["Time", data.time || "Flexible"],
    data.barber ? ["Barber", data.barber.trim()] : null,
    data.notes ? ["Request", data.notes.trim()] : null,
  ].filter(Boolean);

  // summary
  scope.querySelector(".bk-summary").innerHTML = rows
    .map(([k, v]) => `<div class="r"><span class="k">${k}</span><span class="v">${escapeHTML(v)}</span></div>`)
    .join("");

  // whatsapp + call links
  const msg = "New appointment request — Samscales\n\n" + rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  scope.querySelector(".bk-confirm-wa").href = waLink(msg);
  scope.querySelector(".bk-confirm-call").href = "tel:" + SHOP.phoneHref;

  // reveal confirmation + celebrate
  scope.querySelector(".bk-form-wrap").classList.add("hide");
  scope.querySelector(".bk-confirm").classList.add("show");
  scope.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => confetti(scope.querySelector(".bk-confetti")), 120);
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* -------------------------------------------------------------------------
   Boot
   ------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  hydrateShop();
  initNav();
  initLenis();
  initReveals();
  initTilt();
  initBooking();
  const accent = document.querySelector("canvas.three-accent");
  if (accent) initThreeAccent(accent);
});

window.SHOP = SHOP;
window.waLink = waLink;
