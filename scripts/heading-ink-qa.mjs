/**
 * Ground-truth heading spacing, measured from painted pixels.
 *
 *   node scripts/heading-ink-qa.mjs
 *
 * Font metrics can be argued with; pixels cannot. This screenshots each
 * multi-line Arabic heading on its own, at 2x, then scans the rows of the image
 * for ink. Rows containing ink group into bands — one band per visual line of
 * type, including the diacritics above it and the tails below it — and the
 * clear space between consecutive bands is the real gap between the lines.
 *
 * It reports; it does not pass judgement. Two Arabic lines interleave
 * horizontally — a tall أ on the lower line can start above the lowest tail of
 * the line above it at a different x — so they can be perfectly legible and
 * still share every pixel row. Only a human looking at the crop can call it.
 *
 * Writes 2x crops to qa-previews/ink/ for exactly that look.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import puppeteer from "puppeteer-core";
import { PNG } from "./lib/png-reader.mjs";

const SITE = process.env.SITE_URL ?? "http://127.0.0.1:5181";
const CHROME =
  process.env.CHROME_PATH ??
  "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = join("qa-previews", "ink");

const SCALE = 2;
/** a row needs this many ink pixels to count as ink, not as an antialias speck */
const INK_ROW_MIN = 2;
/** clear rows required between two lines of type, in CSS px */
const MIN_GAP_CSS = 2;

const TARGETS = [
  { tag: "hero", selector: ".hero__title" },
  { tag: "positioning", selector: ".positioning__lede .display" },
  { tag: "intelligence", selector: ".intel__head .display" },
  { tag: "about", selector: ".about .display" },
  { tag: "contact", selector: ".contact__intro .display" },
];

const WIDTHS = [390, 1440];

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

/**
 * Rows of the image that carry ink, grouped into bands.
 *
 * The ground is sampled from the corners rather than assumed light: the
 * intelligence section is ivory type on ink, and a fixed "darker than X"
 * threshold read that whole background as ink.
 */
function inkBands(png) {
  const { width, height, data } = png;
  const lumAt = (i) =>
    0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  const corners = [
    0,
    (width - 1) * 4,
    (height - 1) * width * 4,
    ((height - 1) * width + width - 1) * 4,
  ];
  const ground = corners.reduce((a, i) => a + lumAt(i), 0) / corners.length;

  const bands = [];
  let start = null;
  for (let y = 0; y < height; y++) {
    let ink = 0;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] < 24) continue;
      if (Math.abs(lumAt(i) - ground) > 55) ink++;
    }
    if (ink >= INK_ROW_MIN) {
      if (start === null) start = y;
    } else if (start !== null) {
      bands.push([start, y - 1]);
      start = null;
    }
  }
  if (start !== null) bands.push([start, height - 1]);
  return bands;
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--force-prefers-reduced-motion", "--hide-scrollbars"],
});

try {
  for (const width of WIDTHS) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: 900, deviceScaleFactor: SCALE });
    await page.goto(SITE, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);

    console.log(`\n--- ${width}px ---`);

    for (const target of TARGETS) {
      const el = await page.$(target.selector);
      if (!el) {
        console.log(`  ?  ${target.tag} — not found`);
        continue;
      }
      const lineCount = await el.evaluate(
        (node) => node.querySelectorAll(".display__line").length,
      );
      const file = join(OUT, `${target.tag}-${width}.png`);
      const buf = await el.screenshot();
      writeFileSync(file, buf);

      const png = PNG.decode(buf);
      const bands = inkBands(png);
      const gaps = [];
      for (let i = 0; i < bands.length - 1; i++) {
        gaps.push(Math.round(((bands[i + 1][0] - bands[i][1] - 1) / SCALE) * 10) / 10);
      }

      const touchesTop = bands.length > 0 && bands[0][0] <= 0;
      const touchesBottom =
        bands.length > 0 && bands[bands.length - 1][1] >= png.height - 1;
      const tight = gaps.filter((g) => g < MIN_GAP_CSS);

      const detail = [
        `${lineCount} line${lineCount === 1 ? "" : "s"}`,
        `${bands.length} ink band${bands.length === 1 ? "" : "s"}`,
        gaps.length ? `clear rows ${gaps.join(", ")}px` : "—",
      ].join("  ");
      console.log(`     ${target.tag.padEnd(12)} ${detail}`);
      if (bands.length < lineCount) {
        console.log("        (bands merged — lines interleave; check the crop)");
      }
      void touchesTop;
      void touchesBottom;
      void tight;
    }
    await page.close();
  }
} finally {
  await browser.close();
}

console.log(`
Crops written to ${OUT}/ — inspect them; this script reports, it does not grade.`);
