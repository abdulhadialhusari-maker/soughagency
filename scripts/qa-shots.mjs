/**
 * Captures full-page QA previews of the public website at the four
 * required widths. Output: qa-previews/site-<width>.png
 * Requires the dev or preview server on port 5181.
 * Run: npm run qa:shots
 */
import { existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "qa-previews");
const BASE_URL = process.env.SITE_URL ?? "http://127.0.0.1:5181";
const PREFIX = process.env.SHOT_PREFIX ?? "site";

const BROWSERS = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);

const WIDTHS = [1440, 1280, 768, 375];

const exe = BROWSERS.find((p) => existsSync(p));
if (!exe) throw new Error("No Chrome/Edge found. Set CHROME_PATH.");

mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: exe,
  headless: "new",
  args: ["--force-color-profile=srgb", "--hide-scrollbars"],
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(String(err)));

  for (const width of WIDTHS) {
    await page.setViewport({ width, height: 940, deviceScaleFactor: 1 });
    await page.goto(BASE_URL, { waitUntil: "networkidle2" });
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 1400)); // let one-shot animations finish
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    await page.screenshot({ path: join(OUT, `${PREFIX}-${width}.png`), fullPage: true });
    console.log(`✓ ${PREFIX}-${width}.png${overflow > 0 ? `  ⚠ horizontal overflow ${overflow}px` : ""}`);
  }

  console.log(errors.length ? `console errors:\n- ${errors.join("\n- ")}` : "console: clean");
} finally {
  await browser.close();
}
