/**
 * SOGH Arabic display-title QA.
 *
 * This test deliberately verifies physical line separation in addition to
 * CSS line-height. Arabic glyphs, dots, and marks can look crowded even when
 * conventional line boxes do not overlap, so the four display titles use
 * explicit line spans whose actual gap is measured here.
 *
 * Requires the local site on http://127.0.0.1:5181.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "qa-previews", "typography-v2", "after");
const baseUrl = process.env.SITE_URL ?? "http://127.0.0.1:5181";
const viewports = [
  { width: 320, height: 700 },
  { width: 375, height: 812 },
  { width: 430, height: 932 },
  { width: 480, height: 900 },
  { width: 560, height: 800 },
  { width: 640, height: 900 },
  { width: 768, height: 900 },
  { width: 900, height: 900 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1338, height: 628 },
  { width: 1440, height: 900 },
];
const fullPageWidths = new Set([375, 560, 768, 1280, 1338, 1440]);
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

const consoleErrors = [];
const failures = [];
const viewportResults = [];

async function createPage(viewport, reduced = false) {
  const page = await browser.newPage();
  const label = `${viewport.width}x${viewport.height}${reduced ? " reduced" : ""}`;
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(`[${label}] ${message.text()}`);
  });
  page.on("pageerror", (error) => consoleErrors.push(`[${label}] ${String(error)}`));
  await page.setViewport({ ...viewport, deviceScaleFactor: 1 });
  if (reduced) {
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  }
  await page.evaluateOnNewDocument(() => {
    window.__soghCls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__soghCls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  return page;
}

async function settlePage(page) {
  await page.goto(baseUrl, { waitUntil: "networkidle2" });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    document.querySelector(".ai-band")?.scrollIntoView({ block: "center", behavior: "instant" });
  });
  await page.waitForSelector(".ai-band.is-inview, .ai-band:not(.motion-armed)", { timeout: 5000 });
  await new Promise((resolve) => setTimeout(resolve, 1800));
}

async function inspect(page, viewport) {
  return page.evaluate((currentViewport) => {
    const groups = [
      { key: "method", kind: "display", selector: ".method .display-title" },
      { key: "work", kind: "display", selector: ".work .display-title" },
      { key: "work-card-light", kind: "card", selector: ".work-card--light .card-heading" },
      { key: "work-card-dark", kind: "card", selector: ".work-card--dark .card-heading" },
      { key: "ai", kind: "display", selector: ".ai-band .display-title" },
      { key: "about", kind: "display", selector: ".about .display-title" },
    ];

    const titles = groups.map(({ key, kind, selector }) => {
      const element = document.querySelector(selector);
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const fontSize = Number.parseFloat(style.fontSize);
      const lineHeight = Number.parseFloat(style.lineHeight);
      const next = element.nextElementSibling;
      const nextRect = next?.matches("p") ? next.getBoundingClientRect() : null;
      const lines = Array.from(element.querySelectorAll(".display-title__line")).map((line) => {
        const lineStyle = getComputedStyle(line);
        const lineRect = line.getBoundingClientRect();
        return {
          text: line.textContent.trim(),
          top: Number(lineRect.top.toFixed(2)),
          bottom: Number(lineRect.bottom.toFixed(2)),
          width: Number(lineRect.width.toFixed(2)),
          height: Number(lineRect.height.toFixed(2)),
          lineHeight: lineStyle.lineHeight,
          whiteSpace: lineStyle.whiteSpace,
          overflow: lineStyle.overflow,
        };
      });
      const lineGap = lines.length === 2
        ? Number((lines[1].top - lines[0].bottom).toFixed(2))
        : null;

      return {
        key,
        kind,
        text: element.getAttribute("aria-label") ?? element.textContent.trim(),
        fontFamily: style.fontFamily,
        fontSize,
        lineHeight,
        lineHeightRatio: Number((lineHeight / fontSize).toFixed(3)),
        letterSpacing: style.letterSpacing,
        textWrap: style.textWrap,
        overflow: style.overflow,
        transform: style.transform,
        opacity: style.opacity,
        display: style.display,
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
        width: Number(rect.width.toFixed(2)),
        height: Number(rect.height.toFixed(2)),
        spacingAfter: nextRect ? Number((nextRect.top - rect.bottom).toFixed(2)) : null,
        lineGap,
        lines,
      };
    });

    return {
      viewport: currentViewport,
      fontStatus: document.fonts.status,
      alexandriaLoaded: document.fonts.check('700 54px "Alexandria"', "صَوْغ"),
      cls: Number((window.__soghCls ?? 0).toFixed(5)),
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      titles,
    };
  }, viewport);
}

function validate(result) {
  const label = `${result.viewport.width}x${result.viewport.height}`;
  if (result.horizontalOverflow !== 0) failures.push(`${label}: horizontal overflow ${result.horizontalOverflow}px`);
  if (result.fontStatus !== "loaded" || !result.alexandriaLoaded) failures.push(`${label}: Alexandria not loaded`);
  if (result.cls > 0.01) failures.push(`${label}: layout shift ${result.cls}`);

  for (const title of result.titles) {
    if (title.overflow !== "visible") failures.push(`${label} ${title.key}: overflow ${title.overflow}`);
    // Arabic ink may legitimately extend a few pixels beyond its line box.
    // It is only clipped when overflow is non-visible; the delta is retained
    // in the report so a reviewer can correlate it with the close-up images.
    if (title.overflow !== "visible" && title.scrollHeight > title.clientHeight + 1) {
      failures.push(`${label} ${title.key}: clipped content`);
    }
    if (title.transform !== "none") failures.push(`${label} ${title.key}: final transform ${title.transform}`);
    if (title.opacity !== "1") failures.push(`${label} ${title.key}: final opacity ${title.opacity}`);
    if (!title.fontFamily.startsWith("Alexandria")) failures.push(`${label} ${title.key}: wrong font`);
    if (title.letterSpacing.startsWith("-")) failures.push(`${label} ${title.key}: negative tracking ${title.letterSpacing}`);
    if (title.spacingAfter !== null && title.spacingAfter < 18) {
      failures.push(`${label} ${title.key}: only ${title.spacingAfter}px before description`);
    }

    if (title.kind === "display") {
      if (title.lines.length !== 2) failures.push(`${label} ${title.key}: expected exactly two explicit lines`);
      if (title.lineHeightRatio < 1.08 || title.lineHeightRatio > 1.16) {
        failures.push(`${label} ${title.key}: display line-height ratio ${title.lineHeightRatio}`);
      }
      const approvedDesktopWorkLine = title.key === "work" && result.viewport.width >= 1024;
      if (approvedDesktopWorkLine) {
        if (Math.abs(title.lines[0].top - title.lines[1].top) > 1) {
          failures.push(`${label} ${title.key}: approved desktop title is not one visual line`);
        }
      } else if (title.lineGap === null || title.lineGap < 13) {
        failures.push(`${label} ${title.key}: physical line gap ${title.lineGap}px`);
      }
      for (const line of title.lines) {
        if (line.width > title.width + 1) failures.push(`${label} ${title.key}: line exceeds title width`);
        if (line.whiteSpace !== "nowrap") failures.push(`${label} ${title.key}: line is not stable nowrap`);
        if (line.overflow !== "visible") failures.push(`${label} ${title.key}: line overflow ${line.overflow}`);
      }
    } else if (title.lineHeightRatio < 1.45 || title.lineHeightRatio > 1.55) {
      failures.push(`${label} ${title.key}: card line-height ratio ${title.lineHeightRatio}`);
    }
  }
}

for (const viewport of viewports) {
  const page = await createPage(viewport);
  await settlePage(page);
  const result = await inspect(page, viewport);
  validate(result);
  viewportResults.push(result);

  if (fullPageWidths.has(viewport.width)) {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({
      path: join(out, `full-${viewport.width}x${viewport.height}.png`),
      fullPage: true,
    });
  }

  if (viewport.width === 1338) {
    const screenshotWithPadding = async (selector, path, padding = 28) => {
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
    };
    const captures = [
      ["method", ".method .section-heading"],
      ["work", ".work .section-heading"],
      ["work-card-light", ".work-card--light"],
      ["work-card-dark", ".work-card--dark"],
      ["ai", ".ai-band"],
      ["about", ".about__grid"],
    ];
    for (const [name, selector] of captures) {
      await screenshotWithPadding(selector, join(out, `after-${name}-1338x628.png`));
    }
  }

  console.log(`OK ${viewport.width}x${viewport.height} | CLS ${result.cls} | overflow ${result.horizontalOverflow}px`);
  await page.close();
}

// Verify that the approved one-shot motion changes only presentation, not geometry.
const motionViewport = { width: 1338, height: 628 };
const motionPage = await createPage(motionViewport);
await motionPage.goto(baseUrl, { waitUntil: "domcontentloaded" });
await motionPage.evaluate(() => document.fonts.ready);
const readMotionState = () => motionPage.$eval(".ai-band .display-title", (element) => {
  const style = getComputedStyle(element);
  const lines = Array.from(element.querySelectorAll(".display-title__line"));
  return {
    height: element.getBoundingClientRect().height,
    lineHeight: style.lineHeight,
    gap: lines[1].getBoundingClientRect().top - lines[0].getBoundingClientRect().bottom,
    transform: style.transform,
    opacity: style.opacity,
  };
});
const motionBefore = await readMotionState();
await motionPage.evaluate(() => document.querySelector(".ai-band")?.scrollIntoView({ block: "center", behavior: "instant" }));
await motionPage.waitForSelector(".ai-band.is-inview", { timeout: 5000 });
await new Promise((resolve) => setTimeout(resolve, 650));
const motionDuring = await readMotionState();
const aiDuring = await motionPage.$(".ai-band");
await aiDuring.screenshot({ path: join(out, "after-ai-during-motion-1338x628.png") });
await new Promise((resolve) => setTimeout(resolve, 1100));
const motionAfter = await readMotionState();
for (const key of ["height", "lineHeight", "gap"]) {
  if (Math.abs(Number(motionBefore[key]) - Number(motionDuring[key])) > 0.2 ||
      Math.abs(Number(motionDuring[key]) - Number(motionAfter[key])) > 0.2) {
    failures.push(`AI motion changes title ${key}: ${motionBefore[key]} / ${motionDuring[key]} / ${motionAfter[key]}`);
  }
}
if (motionAfter.transform !== "none" || motionAfter.opacity !== "1") {
  failures.push(`AI motion does not settle: ${JSON.stringify(motionAfter)}`);
}
await motionPage.close();

// Reduced motion must preserve identical type geometry and immediately show final state.
const reducedPage = await createPage(motionViewport, true);
await reducedPage.goto(baseUrl, { waitUntil: "networkidle2" });
await reducedPage.evaluate(() => document.fonts.ready);
const reducedMotion = await reducedPage.evaluate(() => ({
  heroClass: document.querySelector(".hero").className,
  aiClass: document.querySelector(".ai-band").className,
  titles: Array.from(document.querySelectorAll(".display-title, .card-heading")).map((element) => {
    const style = getComputedStyle(element);
    return {
      text: element.getAttribute("aria-label") ?? element.textContent.trim(),
      opacity: style.opacity,
      transform: style.transform,
      lineHeight: style.lineHeight,
      height: element.getBoundingClientRect().height,
    };
  }),
}));
if (reducedMotion.heroClass.includes("hero--motion") || reducedMotion.aiClass.includes("motion-armed")) {
  failures.push("Reduced motion still arms the brand sequence");
}
for (const title of reducedMotion.titles) {
  if (title.opacity !== "1" || title.transform !== "none") failures.push(`Reduced-motion title not final: ${title.text}`);
}
await reducedPage.evaluate(() => document.querySelector(".ai-band")?.scrollIntoView({ block: "center", behavior: "instant" }));
const reducedAi = await reducedPage.$(".ai-band");
await reducedAi.screenshot({ path: join(out, "after-ai-reduced-motion-1338x628.png") });
await reducedPage.close();

if (consoleErrors.length) failures.push(...consoleErrors.map((error) => `console: ${error}`));
const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  viewports: viewportResults,
  motion: { before: motionBefore, during: motionDuring, after: motionAfter },
  reducedMotion,
  consoleErrors,
  failures,
};
writeFileSync(join(out, "typography-metrics.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
await browser.close();

if (failures.length) {
  console.error(`FAILED (${failures.length})\n- ${failures.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log("PASS typography QA: physical gaps, exact viewports, motion, reduced motion, CLS, overflow, and console are clean.");
}
