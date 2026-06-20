// Screenshot helper using puppeteer-core + system Chrome.
// Usage:
//   node screenshot.mjs <url> [label] [--mobile]          full-page (auto-scrolls to fire reveals)
//   node screenshot.mjs <url> [label] --at=0.35 [--mobile] viewport capture at scroll fraction
import puppeteer from "puppeteer-core";
import { readdir, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const CHROME_CANDIDATES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
];
const chromePath = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chromePath) { console.error("No Chrome/Edge found."); process.exit(1); }

const url = process.argv[2] || "http://localhost:3000";
const args = process.argv.slice(3);
const mobile = args.includes("--mobile");
const atArg = args.find((a) => a.startsWith("--at="));
const at = atArg ? parseFloat(atArg.split("=")[1]) : null;
const label = args.find((a) => !a.startsWith("--"));

const OUT_DIR = "temporary screenshots";
if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true });
const existing = (await readdir(OUT_DIR)).filter((f) => /^screenshot-\d+/.test(f));
const next = existing.reduce((m, f) => { const x = f.match(/^screenshot-(\d+)/); return x ? Math.max(m, +x[1]) : m; }, 0) + 1;
const name = `screenshot-${next}${label ? "-" + label : ""}${mobile ? "-mobile" : ""}.png`;
const outPath = join(OUT_DIR, name);

const browser = await puppeteer.launch({
  executablePath: chromePath, headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport(mobile
  ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true }
  : { width: 1440, height: 900, deviceScaleFactor: 1 });

await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 1800)); // fonts/initial animation

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (at !== null) {
  // viewport capture at a scroll fraction.
  // If a #scroll-container exists, the fraction maps to ITS ScrollTrigger progress
  // (which begins only after the 100vh hero). frac<=0 captures the hero at top.
  await page.evaluate((frac) => {
    const sc = document.getElementById("scroll-container");
    let target;
    if (frac <= 0) target = 0;
    else if (sc) target = sc.offsetTop + frac * (sc.offsetHeight - window.innerHeight);
    else target = (document.documentElement.scrollHeight - window.innerHeight) * frac;
    if (window.__lenis) window.__lenis.scrollTo(target, { immediate: true });
    else window.scrollTo(0, target);
  }, at);
  await sleep(1800);
  await page.screenshot({ path: outPath });
} else {
  // full page: scroll through to trigger IntersectionObserver reveals, then back to top
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.6;
    const max = document.documentElement.scrollHeight;
    for (let y = 0; y < max; y += step) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
    window.scrollTo(0, 0);
  });
  await sleep(700);
  await page.screenshot({ path: outPath, fullPage: true });
}

await browser.close();
console.log("Saved", outPath);
