/**
 * Targeted QA for the blue Hero word refinement.
 *
 * Verifies the punctuation-only scale, removed underline, settled/reduced
 * motion parity, clipping, line separation, zoom, and horizontal overflow.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "qa-previews", "hero-word-refinement");
const baseUrl = process.env.SITE_URL ?? "http://127.0.0.1:5181";
const viewports = [
  { width: 320, height: 700 },
  { width: 375, height: 812 },
  { width: 430, height: 932 },
  { width: 560, height: 800 },
  { width: 768, height: 900 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1338, height: 628 },
  { width: 1440, height: 900 },
];
const browserPaths = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);
const executablePath = browserPaths.find((path) => existsSync(path));

if (!executablePath) throw new Error("No Chrome/Edge found. Set CHROME_PATH.");
mkdirSync(out, { recursive: true });

const browser = await puppeteer.launch({
  executablePath,
  headless: "new",
  args: ["--force-color-profile=srgb", "--hide-scrollbars"],
});
const failures = [];
const consoleErrors = [];
const results = [];

function monitor(page, label) {
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(`[${label}] ${message.text()}`);
  });
  page.on("pageerror", (error) => consoleErrors.push(`[${label}] ${String(error)}`));
}

async function settle(page) {
  await page.goto(baseUrl, { waitUntil: "networkidle2" });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((resolve) => setTimeout(resolve, 2200));
}

async function readHero(page, viewport) {
  return page.evaluate((testedViewport) => {
    const hero = document.querySelector(".hero");
    const title = document.querySelector(".hero-title");
    const lines = Array.from(title.querySelectorAll(".hero-title__line"));
    const accent = document.querySelector(".hero-title__accent");
    const punctuation = document.querySelector(".hero-title__punctuation");
    const titleStyle = getComputedStyle(title);
    const accentStyle = getComputedStyle(accent);
    const punctuationStyle = getComputedStyle(punctuation);
    const secondRect = lines[1].getBoundingClientRect();
    const accentRect = accent.getBoundingClientRect();
    const punctuationRect = punctuation.getBoundingClientRect();
    const titleFontSize = Number.parseFloat(titleStyle.fontSize);
    const punctuationFontSize = Number.parseFloat(punctuationStyle.fontSize);

    return {
      viewport: testedViewport,
      zoom: { devicePixelRatio, visualScale: window.visualViewport?.scale ?? 1 },
      fontStatus: document.fonts.status,
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      heroClass: hero.className,
      titleAriaLabel: title.getAttribute("aria-label"),
      lineCount: lines.length,
      accentText: accent.textContent.trim(),
      punctuationText: punctuation.textContent,
      punctuationCount: title.querySelectorAll(".hero-title__punctuation").length,
      punctuationRatio: Number((punctuationFontSize / titleFontSize).toFixed(3)),
      pseudoContent: getComputedStyle(accent, "::after").content,
      overflow: accentStyle.overflow,
      titleOpacity: titleStyle.opacity,
      titleTransform: titleStyle.transform,
      lineGap: Number((accentRect.top - secondRect.bottom).toFixed(2)),
      accentRect: {
        top: Number(accentRect.top.toFixed(2)),
        bottom: Number(accentRect.bottom.toFixed(2)),
        left: Number(accentRect.left.toFixed(2)),
        right: Number(accentRect.right.toFixed(2)),
      },
      punctuationRect: {
        top: Number(punctuationRect.top.toFixed(2)),
        bottom: Number(punctuationRect.bottom.toFixed(2)),
        left: Number(punctuationRect.left.toFixed(2)),
        right: Number(punctuationRect.right.toFixed(2)),
      },
      runningHeroAnimations: hero
        .getAnimations({ subtree: true })
        .filter((animation) => animation.playState === "running").length,
    };
  }, viewport);
}

async function screenshotWithPadding(page, selector, path, padding = 34) {
  const element = await page.$(selector);
  await element.scrollIntoView();
  const box = await element.boundingBox();
  const pageSize = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
  }));
  const x = Math.max(0, box.x + pageSize.scrollX - padding);
  const y = Math.max(0, box.y + pageSize.scrollY - padding);

  await page.screenshot({
    path,
    captureBeyondViewport: true,
    clip: {
      x,
      y,
      width: Math.min(pageSize.width - x, box.width + padding * 2),
      height: Math.min(pageSize.height - y, box.height + padding * 2),
    },
  });
}

for (const viewport of viewports) {
  const label = `${viewport.width}x${viewport.height}`;
  const page = await browser.newPage();
  monitor(page, label);
  await page.setViewport({ ...viewport, deviceScaleFactor: 1 });
  await settle(page);
  const result = await readHero(page, viewport);

  if (result.zoom.devicePixelRatio !== 1 || result.zoom.visualScale !== 1) failures.push(`${label}: browser zoom is not 100%`);
  if (result.fontStatus !== "loaded") failures.push(`${label}: fonts did not settle`);
  if (result.horizontalOverflow !== 0) failures.push(`${label}: horizontal overflow ${result.horizontalOverflow}px`);
  if (result.lineCount !== 3 || result.titleAriaLabel !== "نصوغ العلامات للنمو.") failures.push(`${label}: Hero text structure changed`);
  if (result.accentText !== "للنمو." || result.punctuationText !== "." || result.punctuationCount !== 1) failures.push(`${label}: punctuation isolation is incorrect`);
  if (result.punctuationRatio < 0.55 || result.punctuationRatio > 0.65) failures.push(`${label}: punctuation ratio ${result.punctuationRatio}`);
  if (result.pseudoContent !== "none") failures.push(`${label}: underline pseudo-element still renders (${result.pseudoContent})`);
  if (result.overflow !== "visible") failures.push(`${label}: blue word overflow is ${result.overflow}`);
  if (result.lineGap < 8) failures.push(`${label}: black/blue line gap is only ${result.lineGap}px`);
  if (result.punctuationRect.top < result.accentRect.top - 0.5 || result.punctuationRect.bottom > result.accentRect.bottom + 0.5) failures.push(`${label}: punctuation is vertically clipped`);
  if (result.punctuationRect.left < result.accentRect.left - 0.5 || result.punctuationRect.right > result.accentRect.right + 0.5) failures.push(`${label}: punctuation is horizontally clipped`);
  if (result.titleOpacity !== "1" || result.titleTransform !== "none" || result.runningHeroAnimations !== 0) failures.push(`${label}: Hero motion did not settle cleanly`);

  if (viewport.width === 1338) {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({ path: join(out, "hero-1338x628.png"), fullPage: false });
    await screenshotWithPadding(page, ".hero-title", join(out, "after-hero-closeup-1338x628.png"));
  }
  if (viewport.width === 375) {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({ path: join(out, "hero-375x812.png"), fullPage: false });
  }

  results.push(result);
  console.log(`OK ${label} | gap ${result.lineGap}px | overflow ${result.horizontalOverflow}px`);
  await page.close();
}

const reducedPage = await browser.newPage();
monitor(reducedPage, "1338x628 reduced-motion");
await reducedPage.setViewport({ width: 1338, height: 628, deviceScaleFactor: 1 });
await reducedPage.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
await reducedPage.goto(baseUrl, { waitUntil: "networkidle2" });
await reducedPage.evaluate(() => document.fonts.ready);
const reducedState = await readHero(reducedPage, { width: 1338, height: 628 });
if (reducedState.heroClass.includes("hero--motion") || reducedState.titleOpacity !== "1" || reducedState.titleTransform !== "none") failures.push("Reduced motion does not render the final Hero immediately");
if (reducedState.pseudoContent !== "none" || reducedState.accentText !== "للنمو." || reducedState.punctuationRatio !== 0.6) failures.push("Reduced motion final composition differs from the normal Hero");
await screenshotWithPadding(reducedPage, ".hero-title", join(out, "reduced-hero-closeup-1338x628.png"));
await reducedPage.close();

const motionPage = await browser.newPage();
monitor(motionPage, "1338x628 motion-recording");
await motionPage.setViewport({ width: 1338, height: 628, deviceScaleFactor: 1 });
await settle(motionPage);
const recorder = await motionPage.screencast({ path: join(out, "hero-motion-1338x628.webm") });
await motionPage.evaluate(() => {
  const hero = document.querySelector(".hero");
  hero.classList.remove("hero--motion");
  void hero.offsetWidth;
  hero.classList.add("hero--motion");
});
await new Promise((resolve) => setTimeout(resolve, 2400));
await recorder.stop();
const motionFinalState = await readHero(motionPage, { width: 1338, height: 628 });
if (motionFinalState.pseudoContent !== "none" || motionFinalState.runningHeroAnimations !== 0) failures.push("Recorded Hero motion did not finish in the clean final state");
await motionPage.close();

if (consoleErrors.length) failures.push(...consoleErrors.map((error) => `console: ${error}`));
const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  results,
  reducedState,
  motionFinalState,
  consoleErrors,
  failures,
};
writeFileSync(join(out, "hero-word-metrics.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
await browser.close();

if (failures.length) {
  console.error(`FAILED (${failures.length})\n- ${failures.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log("PASS targeted Hero word QA. Review the PNG and WebM deliverables at original size.");
}
