/**
 * Captures full-page QA previews of the public website across the release width
 * matrix, and reports horizontal overflow and console errors at each width.
 *
 *   npm run qa:shots
 *   QA_WIDTHS="1440,768" npm run qa:shots      # narrow the matrix
 *   QA_MOTION=1 npm run qa:shots               # capture with motion allowed
 *
 * Output: qa-previews/<prefix>-<width>.png
 * Requires the dev or preview server on port 5181.
 *
 * By default the page is captured with `prefers-reduced-motion: reduce`. That is
 * not a shortcut around the animations — it is the state this site is built to
 * fall back to, so it renders every section complete and identical on every run.
 * A capture that depends on scroll reveals firing is not reproducible, and a
 * layout bug hiding behind an unplayed animation is exactly what this pass is
 * meant to catch.
 */
import { existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "qa-previews");
const BASE_URL = process.env.SITE_URL ?? "http://127.0.0.1:5181";
const PREFIX = process.env.SHOT_PREFIX ?? "site";
const REDUCED = process.env.QA_MOTION !== "1";

const BROWSERS = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);

// the release matrix: the five required widths plus the common laptop width
const WIDTHS = (process.env.QA_WIDTHS ?? "1440,1280,1024,768,390,360")
  .split(",")
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isFinite(value) && value > 0);

const exe = BROWSERS.find((p) => existsSync(p));
if (!exe) throw new Error("No Chrome/Edge found. Set CHROME_PATH.");

mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: exe,
  headless: "new",
  protocolTimeout: 120_000,
  args: ["--force-color-profile=srgb", "--hide-scrollbars"],
});

let failures = 0;

try {
  const page = await browser.newPage();
  if (REDUCED) {
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);
  }

  for (const width of WIDTHS) {
    const errors = [];
    const onConsole = (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    };
    const onPageError = (err) => errors.push(String(err));
    page.on("console", onConsole);
    page.on("pageerror", onPageError);

    await page.setViewport({ width, height: 940, deviceScaleFactor: 1 });
    await page.goto(BASE_URL, { waitUntil: "networkidle2" });

    // lazy images below the fold never load in a full-page capture, so promote
    // them for the shot only, then wait for the whole set to settle
    await page.evaluate(() => {
      for (const img of document.images) img.loading = "eager";
    });
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          const pending = [...document.images].filter((img) => !img.complete);
          if (!pending.length) return resolve();
          let left = pending.length;
          const done = () => --left <= 0 && resolve();
          for (const img of pending) {
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });
          }
          setTimeout(resolve, 5000);
        }),
    );
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    await new Promise((r) => setTimeout(r, 400));

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    await page.screenshot({
      path: join(OUT, `${PREFIX}-${width}.png`),
      fullPage: true,
    });

    page.off("console", onConsole);
    page.off("pageerror", onPageError);

    const notes = [];
    if (overflow > 0) notes.push(`horizontal overflow ${overflow}px`);
    if (errors.length) notes.push(`console: ${errors.join(" | ")}`);
    if (notes.length) failures++;
    console.log(
      `${notes.length ? "x" : "+"} ${PREFIX}-${width}.png${notes.length ? "  -- " + notes.join("; ") : ""}`,
    );
  }
} finally {
  await browser.close();
}

console.log(
  failures
    ? `\n${failures} width(s) reported a problem.`
    : `\nclean: no horizontal overflow, no console errors (${REDUCED ? "reduced motion" : "motion on"}).`,
);
process.exit(failures ? 1 : 0);
