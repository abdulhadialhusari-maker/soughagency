/**
 * SOGH motion QA — records and frames the hero + AI-band sequences.
 *
 * Outputs into qa-previews/motion/:
 *   hero-motion.webm            screen recording of load + scroll to AI band
 *   hero-{before,during,after}.png
 *   ai-{before,during,after}.png
 *   reduced-hero.png, reduced-ai.png   (prefers-reduced-motion emulated)
 *   final-<width>.png                  settled state at 375/560/768/1280/1440
 *
 * Requires the dev server on port 5181. Run: node scripts/motion-qa.mjs
 */
import { existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "qa-previews", process.env.MOTION_DIR ?? "motion");
const BASE_URL = process.env.SITE_URL ?? "http://127.0.0.1:5181";

const BROWSERS = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);

const exe = BROWSERS.find((p) => existsSync(p));
if (!exe) throw new Error("No Chrome/Edge found. Set CHROME_PATH.");
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: exe,
  headless: "new",
  args: ["--force-color-profile=srgb", "--hide-scrollbars"],
});

const errors = [];

async function newPage(reduced = false) {
  const page = await browser.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  if (reduced) {
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  }
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  return page;
}

/* --- 1. normal motion: recording + hero frames --- */
{
  const page = await newPage();
  // capture "before/during" frames from a paused-clock run first
  const client = await page.createCDPSession();
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts.ready);

  // fresh load with recording
  const recorder = await page.screencast({ path: join(OUT, "hero-motion.webm") });
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 2300)); // hero sequence ~1.75s + settle
  // scroll to the AI band to record its one-shot sequence
  await page.evaluate(() => document.querySelector(".ai-band").scrollIntoView({ behavior: "smooth", block: "center" }));
  await page.waitForSelector(".ai-band.is-inview", { timeout: 5000 });
  await new Promise((r) => setTimeout(r, 2000));
  await recorder.stop();
  console.log("✓ hero-motion.webm");
  await client.detach().catch(() => {});
  await page.close();
}

/* --- 2. deterministic frames: freeze animations at chosen moments --- */
{
  const page = await newPage();
  const grab = async (t, name, selector) => {
    // reload, pause all animations at time t via WAAPI
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    await page.evaluate((ms) => {
      const anims = document.getAnimations();
      anims.forEach((a) => {
        a.pause();
        a.currentTime = ms;
      });
    }, t);
    const el = await page.$(selector);
    await el.screenshot({ path: join(OUT, name) });
    console.log("✓", name);
  };
  await grab(60, "hero-before.png", ".hero__craft");
  await grab(900, "hero-during.png", ".hero__craft");
  await grab(2000, "hero-after.png", ".hero__craft");
  await grab(60, "hero-title-before.png", ".hero-title");
  await grab(900, "hero-title-during.png", ".hero-title");
  await grab(2000, "hero-title-after.png", ".hero-title");
  await page.close();
}

/* --- 3. AI band frames --- */
{
  const page = await newPage();
  const scrollToBand = () =>
    page.evaluate(() => {
      const band = document.querySelector(".ai-band");
      const y = band.getBoundingClientRect().top + scrollY - innerHeight / 2 + band.offsetHeight / 2;
      window.scrollTo({ top: y, behavior: "instant" });
    });

  const grabAi = async (t, name) => {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    await scrollToBand();
    await page.waitForSelector(".ai-band.is-inview", { timeout: 5000 });
    await page.evaluate((ms) => {
      document.getAnimations().forEach((a) => {
        a.pause();
        a.currentTime = ms;
      });
    }, t);
    const el = await page.$(".ai-band");
    await el.screenshot({ path: join(OUT, name) });
    console.log("✓", name);
  };
  await grabAi(30, "ai-before.png");
  await grabAi(600, "ai-during.png");
  await grabAi(1600, "ai-after.png");

  // once-only check: scroll away and back must not replay
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await scrollToBand();
  await page.waitForSelector(".ai-band.is-inview", { timeout: 5000 });
  await new Promise((r) => setTimeout(r, 1800));
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await new Promise((r) => setTimeout(r, 400));
  await scrollToBand();
  await new Promise((r) => setTimeout(r, 500));
  const replayed = await page.evaluate(() =>
    document
      .getAnimations()
      .some((a) => a.effect?.getComputedTiming().localTime < 450 && a.playState === "running")
  );
  console.log("ai replay on rescroll:", replayed ? "⚠ REPLAYED" : "✓ none (plays once)");
  await page.close();
}

/* --- 4. reduced motion: final state must render immediately --- */
{
  const page = await newPage(true);
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 250));
  const state = await page.evaluate(() => {
    const dash = (sel) => getComputedStyle(document.querySelector(sel)).strokeDashoffset;
    return {
      heroClass: document.querySelector(".hero").className,
      noiseOffset: dash(".hero__signalmark .sig-noise"),
      wmOffset: dash(".hero__wordmark .wm-p1"),
      dotOpacity: getComputedStyle(document.querySelector(".hero__signalmark .sig-dot")).opacity,
    };
  });
  console.log("reduced-motion state:", JSON.stringify(state));
  const hero = await page.$(".hero__craft");
  await hero.screenshot({ path: join(OUT, "reduced-hero.png") });
  await page.evaluate(() => document.querySelector(".ai-band").scrollIntoView({ block: "center" }));
  await new Promise((r) => setTimeout(r, 300));
  const ai = await page.$(".ai-band");
  await ai.screenshot({ path: join(OUT, "reduced-ai.png") });
  console.log("✓ reduced-hero.png / reduced-ai.png");
  await page.close();
}

/* --- 5. settled final state + overflow at required widths --- */
{
  const page = await newPage();
  for (const width of [1440, 1280, 768, 560, 375]) {
    await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
    await page.goto(BASE_URL, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2200));
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    await page.screenshot({ path: join(OUT, `final-${width}.png`), fullPage: false });
    console.log(`✓ final-${width}.png${overflow > 0 ? `  ⚠ overflow ${overflow}px` : ""}`);
  }
  await page.close();
}

console.log(errors.length ? `console errors:\n- ${errors.join("\n- ")}` : "console: clean");
await browser.close();
