/**
 * SOGH targeted Arabic typography pass 3 QA.
 *
 * Automated checks here are supporting evidence only. The generated PNGs
 * must still be opened at original size and reviewed as visible glyph ink.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "qa-previews", "typography-pass3", "after");
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

async function createPage(viewport, reduced = false) {
  const page = await browser.newPage();
  const label = `${viewport.width}x${viewport.height}${reduced ? " reduced" : ""}`;
  await page.setViewport({ ...viewport, deviceScaleFactor: 1 });
  if (reduced) {
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  }
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(`[${label}] ${message.text()}`);
  });
  page.on("pageerror", (error) => consoleErrors.push(`[${label}] ${String(error)}`));
  return page;
}

async function settle(page) {
  await page.goto(baseUrl, { waitUntil: "networkidle2" });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((resolve) => setTimeout(resolve, 2200));
  await page.evaluate(() => document.querySelector(".ai-band")?.scrollIntoView({ block: "center", behavior: "instant" }));
  await page.waitForSelector(".ai-band.is-inview, .ai-band:not(.motion-armed)", { timeout: 5000 });
  await new Promise((resolve) => setTimeout(resolve, 1400));
}

async function screenshotWithPadding(page, selector, path, padding = 28) {
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
  const page = await createPage(viewport);
  await settle(page);
  const result = await page.evaluate((currentViewport) => {
    const styleData = (selector) => {
      const element = document.querySelector(selector);
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        text: element.getAttribute("aria-label") ?? element.textContent.trim(),
        display: style.display,
        fontSize: Number.parseFloat(style.fontSize),
        lineHeight: Number.parseFloat(style.lineHeight),
        letterSpacing: style.letterSpacing,
        overflow: style.overflow,
        opacity: style.opacity,
        transform: style.transform,
        width: Number(rect.width.toFixed(2)),
        height: Number(rect.height.toFixed(2)),
      };
    };
    const hero = styleData(".hero-title");
    hero.lines = Array.from(document.querySelectorAll(".hero-title__line")).map((line) => {
      const rect = line.getBoundingClientRect();
      const style = getComputedStyle(line);
      return {
        text: line.textContent.trim(),
        top: Number(rect.top.toFixed(2)),
        bottom: Number(rect.bottom.toFixed(2)),
        marginBlockStart: style.marginBlockStart,
      };
    });
    const method = styleData(".method .display-title");
    method.lines = Array.from(document.querySelectorAll(".method .display-title__line")).map((line) => {
      const rect = line.getBoundingClientRect();
      return { text: line.textContent.trim(), top: Number(rect.top.toFixed(2)), bottom: Number(rect.bottom.toFixed(2)) };
    });
    const work = styleData(".work .display-title");
    work.lines = Array.from(document.querySelectorAll(".work .display-title__line")).map((line) => {
      const rect = line.getBoundingClientRect();
      return { text: line.textContent.trim(), top: Number(rect.top.toFixed(2)), bottom: Number(rect.bottom.toFixed(2)) };
    });
    const cards = [".work-card--light .card-heading", ".work-card--dark .card-heading"].map(styleData);
    const ai = styleData(".ai-band .display-title");
    return {
      viewport: currentViewport,
      zoom: { devicePixelRatio, visualScale: window.visualViewport?.scale ?? 1 },
      fontStatus: document.fonts.status,
      alexandriaLoaded: document.fonts.check('700 54px "Alexandria"', "صَوْغ"),
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      hero,
      method,
      work,
      cards,
      ai,
    };
  }, viewport);

  const label = `${viewport.width}x${viewport.height}`;
  if (result.horizontalOverflow !== 0) failures.push(`${label}: horizontal overflow ${result.horizontalOverflow}px`);
  if (result.fontStatus !== "loaded" || !result.alexandriaLoaded) failures.push(`${label}: Alexandria not loaded`);
  if (result.hero.lines.length !== 3) failures.push(`${label}: hero does not contain three explicit groups`);
  if (result.hero.transform !== "none" || result.hero.opacity !== "1") failures.push(`${label}: hero motion did not settle`);
  if (result.method.lines.length !== 2) failures.push(`${label}: method does not contain two explicit lines`);
  if (result.method.letterSpacing.startsWith("-")) failures.push(`${label}: method has negative tracking`);
  if (viewport.width >= 1024 && Math.abs(result.work.lines[0].top - result.work.lines[1].top) > 1) {
    failures.push(`${label}: work heading is not one visual line on desktop`);
  }
  if (viewport.width < 1024 && Math.abs(result.work.lines[0].top - result.work.lines[1].top) < 10) {
    failures.push(`${label}: work heading is not two controlled lines below desktop`);
  }
  for (const card of result.cards) {
    if (card.letterSpacing.startsWith("-")) failures.push(`${label}: card has negative tracking`);
    if (card.lineHeight / card.fontSize < 1.24) failures.push(`${label}: card line-height below 1.24`);
  }
  for (const title of [result.hero, result.method, result.work, result.ai]) {
    if (title.overflow !== "visible") failures.push(`${label}: title overflow is ${title.overflow}`);
  }

  if (viewport.width === 1338) {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await screenshotWithPadding(page, ".hero-title", join(out, "after-hero-1338x628.png"), 34);
    await screenshotWithPadding(page, ".method .section-heading", join(out, "after-method-1338x628.png"), 34);
    await screenshotWithPadding(page, ".work .section-heading", join(out, "after-work-1338x628.png"), 34);
    await screenshotWithPadding(page, ".work-card--light", join(out, "after-card-light-1338x628.png"), 20);
    await screenshotWithPadding(page, ".work-card--dark", join(out, "after-card-dark-1338x628.png"), 20);
    await screenshotWithPadding(page, ".ai-band", join(out, "after-ai-1338x628.png"), 0);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({ path: join(out, "full-1338x628.png"), fullPage: true });
  }
  if (viewport.width === 375) {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({ path: join(out, "full-375x812.png"), fullPage: true });
  }
  results.push(result);
  console.log(`OK ${label} | overflow ${result.horizontalOverflow}px`);
  await page.close();
}

// Reduced motion must render the same complete vertical composition immediately.
const reducedPage = await createPage({ width: 1338, height: 628 }, true);
await reducedPage.goto(baseUrl, { waitUntil: "networkidle2" });
await reducedPage.evaluate(() => document.fonts.ready);
const reducedState = await reducedPage.evaluate(() => {
  const hero = document.querySelector(".hero-title");
  const style = getComputedStyle(hero);
  return {
    heroClass: document.querySelector(".hero").className,
    lineCount: hero.querySelectorAll(".hero-title__line").length,
    opacity: style.opacity,
    transform: style.transform,
  };
});
if (reducedState.heroClass.includes("hero--motion") || reducedState.lineCount !== 3 || reducedState.transform !== "none" || reducedState.opacity !== "1") {
  failures.push(`Reduced motion hero mismatch: ${JSON.stringify(reducedState)}`);
}
await screenshotWithPadding(reducedPage, ".hero-title", join(out, "after-hero-reduced-motion-1338x628.png"), 34);
await reducedPage.close();

// Short visual review recording: settled hero -> method -> work -> AI.
const recordingPage = await createPage({ width: 1338, height: 628 });
const recorder = await recordingPage.screencast({ path: join(out, "pass3-scroll-review.webm") });
await recordingPage.goto(baseUrl, { waitUntil: "domcontentloaded" });
await recordingPage.evaluate(() => document.fonts.ready);
await new Promise((resolve) => setTimeout(resolve, 2300));
for (const selector of ["#method", "#work", ".ai-band"]) {
  await recordingPage.evaluate((target) => document.querySelector(target)?.scrollIntoView({ block: "start", behavior: "smooth" }), selector);
  await new Promise((resolve) => setTimeout(resolve, 1500));
}
await recorder.stop();
await recordingPage.close();

if (consoleErrors.length) failures.push(...consoleErrors.map((error) => `console: ${error}`));
const report = { generatedAt: new Date().toISOString(), baseUrl, results, reducedState, consoleErrors, failures };
writeFileSync(join(out, "pass3-metrics.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
await browser.close();

if (failures.length) {
  console.error(`FAILED (${failures.length})\n- ${failures.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log("PASS supporting QA. Open the generated PNGs at original size before approval.");
}
