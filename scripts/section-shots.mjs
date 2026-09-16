/**
 * Per-section captures for visual review.
 *
 * Full-page captures of a long RTL page are unreadable in review and too tall
 * to share, so this crops the three sections under scrutiny — hero, clients,
 * and the contact heading — at one desktop and one mobile width.
 *
 *   node scripts/section-shots.mjs before
 *   node scripts/section-shots.mjs after
 *
 * Waits on document.fonts.ready before every shot: Alexandria changes the
 * metrics of every heading, so a pre-font capture measures nothing.
 */
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import puppeteer from "puppeteer-core";

const LABEL = process.argv[2] ?? "shot";
const SITE = process.env.SITE_URL ?? "http://127.0.0.1:5181";
const OUT = join("qa-previews", "sections");

const CHROME =
  process.env.CHROME_PATH ??
  "C:/Program Files/Google/Chrome/Application/chrome.exe";

const VIEWPORTS = [
  { tag: "desktop", width: 1440, height: 900 },
  { tag: "mobile", width: 390, height: 844 },
];

const TARGETS = [
  { tag: "hero", selector: "#home" },
  { tag: "clients", selector: ".clients" },
  { tag: "contact", selector: ".contact__intro" },
];

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--force-prefers-reduced-motion", "--hide-scrollbars"],
});

try {
  for (const view of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: view.width, height: view.height });
    await page.goto(SITE, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));

    for (const target of TARGETS) {
      const el = await page.$(target.selector);
      if (!el) {
        console.log(`!  ${target.tag} (${view.tag}) — selector not found`);
        continue;
      }
      await el.screenshot({
        path: join(OUT, `${LABEL}-${target.tag}-${view.tag}.png`),
      });
      console.log(`+  ${LABEL}-${target.tag}-${view.tag}.png`);
    }
    await page.close();
  }
} finally {
  await browser.close();
}
