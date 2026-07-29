/**
 * Final production release gate for the standalone SOGH public website.
 * Run against a production preview with SITE_URL=http://127.0.0.1:5182.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "qa-previews", process.env.RELEASE_QA_DIR ?? "release-r2");
const baseUrl = process.env.SITE_URL ?? "http://127.0.0.1:5182";
const viewports = [
  { width: 280, height: 700, diagnostic: true },
  { width: 300, height: 700, diagnostic: true },
  { width: 305, height: 700, diagnostic: true },
  { width: 320, height: 700 },
  { width: 360, height: 800 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
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
  args: ["--force-color-profile=srgb"],
});
const failures = [];
const consoleErrors = [];
const responsive = [];

function monitor(page, label) {
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(`[${label}] ${message.text()}`);
  });
  page.on("pageerror", (error) => consoleErrors.push(`[${label}] ${String(error)}`));
}

async function load(page) {
  await page.goto(baseUrl, { waitUntil: "networkidle2" });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((resolve) => setTimeout(resolve, 1900));
}

for (const viewport of viewports) {
  const page = await browser.newPage();
  const label = `${viewport.width}x${viewport.height}`;
  monitor(page, label);
  await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 });
  await load(page);
  const result = await page.evaluate((testedViewport) => {
    const root = document.documentElement;
    const isVisible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const selector = (element) => {
      if (element.id) return `${element.tagName.toLowerCase()}#${element.id}`;
      const classes = Array.from(element.classList).slice(0, 3).join(".");
      return `${element.tagName.toLowerCase()}${classes ? `.${classes}` : ""}`;
    };
    const bounds = (query) => {
      const rect = document.querySelector(query).getBoundingClientRect();
      return {
        left: Number(rect.left.toFixed(2)),
        right: Number(rect.right.toFixed(2)),
        width: Number(rect.width.toFixed(2)),
      };
    };
    const offenders = Array.from(document.querySelectorAll("*")).filter((element) => {
      if (!isVisible(element)) return false;
      const rect = element.getBoundingClientRect();
      return rect.left < -0.5 || rect.right > root.clientWidth + 0.5;
    }).map(selector);
    const title = document.querySelector(".hero-title");
    const punctuation = document.querySelector(".hero-title__punctuation");

    return {
      viewport: testedViewport,
      clientWidth: root.clientWidth,
      scrollWidth: root.scrollWidth,
      horizontalOverflow: root.scrollWidth - root.clientWidth,
      devicePixelRatio,
      visualScale: window.visualViewport?.scale ?? 1,
      offenders,
      brokenImages: Array.from(document.images)
        .filter((image) => !image.complete || image.naturalWidth === 0)
        .map((image) => image.getAttribute("src")),
      method: bounds(".method .display-title"),
      footer: bounds(".public-footer"),
      form: bounds(".project-form"),
      header: bounds(".public-header"),
      heroUnderline: getComputedStyle(document.querySelector(".hero-title__accent"), "::after").content,
      punctuationRatio: Number((
        Number.parseFloat(getComputedStyle(punctuation).fontSize)
        / Number.parseFloat(getComputedStyle(title).fontSize)
      ).toFixed(2)),
      fontStatus: document.fonts.status,
    };
  }, viewport);

  if (result.horizontalOverflow !== 0) failures.push(`${label}: horizontal overflow ${result.horizontalOverflow}px`);
  if (result.offenders.length) failures.push(`${label}: edge offenders ${result.offenders.join(", ")}`);
  if (result.brokenImages.length) failures.push(`${label}: broken images ${result.brokenImages.join(", ")}`);
  if (result.fontStatus !== "loaded") failures.push(`${label}: fonts did not settle`);
  if (result.devicePixelRatio !== 1 || result.visualScale !== 1) failures.push(`${label}: browser zoom is not 100%`);
  if (result.heroUnderline !== "none" || result.punctuationRatio !== 0.6) failures.push(`${label}: Hero word regression`);
  responsive.push(result);
  console.log(`OK ${label} | overflow ${result.horizontalOverflow}px | offenders ${result.offenders.length}`);
  await page.close();
}

const functionalPage = await browser.newPage();
monitor(functionalPage, "functional");
await functionalPage.setViewport({ width: 360, height: 800, deviceScaleFactor: 1 });
await load(functionalPage);

await functionalPage.keyboard.press("Tab");
await new Promise((resolve) => setTimeout(resolve, 300));
const skipFocus = await functionalPage.evaluate(() => {
  const element = document.activeElement;
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return {
    className: element.className,
    href: element.getAttribute("href"),
    transform: style.transform,
    outlineStyle: style.outlineStyle,
    outlineWidth: style.outlineWidth,
    top: Number(rect.top.toFixed(2)),
    bottom: Number(rect.bottom.toFixed(2)),
  };
});
if (
  skipFocus.className !== "skip-link"
  || skipFocus.href !== "#main"
  || skipFocus.transform !== "matrix(1, 0, 0, 1, 0, 0)"
  || skipFocus.outlineStyle !== "solid"
  || Number.parseFloat(skipFocus.outlineWidth) < 3
  || skipFocus.top < 0
  || skipFocus.bottom <= 0
) {
  failures.push(`Skip link keyboard focus failed: ${JSON.stringify(skipFocus)}`);
}

await functionalPage.click("[data-testid='menu-toggle']");
const menuOpen = await functionalPage.evaluate(() => ({
  expanded: document.querySelector("[data-testid='menu-toggle']").getAttribute("aria-expanded"),
  visibleLinks: Array.from(document.querySelectorAll("#public-navigation a")).filter((link) => link.getClientRects().length).length,
}));
await functionalPage.keyboard.press("Escape");
const menuEscaped = await functionalPage.evaluate(() => ({
  expanded: document.querySelector("[data-testid='menu-toggle']").getAttribute("aria-expanded"),
  hiddenFocusable: Array.from(document.querySelectorAll("#public-navigation a")).filter((link) => link.getClientRects().length).length,
}));
await functionalPage.click("[data-testid='menu-toggle']");
await functionalPage.click("#public-navigation a[href='#method']");
const menuLinkSelected = await functionalPage.evaluate(() => ({
  hash: location.hash,
  expanded: document.querySelector("[data-testid='menu-toggle']").getAttribute("aria-expanded"),
}));
if (menuOpen.expanded !== "true" || menuOpen.visibleLinks !== 6) failures.push(`Mobile menu open failed: ${JSON.stringify(menuOpen)}`);
if (menuEscaped.expanded !== "false" || menuEscaped.hiddenFocusable !== 0) failures.push(`Mobile menu Escape failed: ${JSON.stringify(menuEscaped)}`);
if (menuLinkSelected.hash !== "#method" || menuLinkSelected.expanded !== "false") failures.push(`Mobile menu link failed: ${JSON.stringify(menuLinkSelected)}`);

await functionalPage.click("button[type='submit']");
const emptyForm = await functionalPage.evaluate(() => ({
  activeName: document.activeElement?.getAttribute("name"),
  errors: Array.from(document.querySelectorAll(".form-error")).map((error) => ({ id: error.id, text: error.textContent.trim() })),
  invalid: Array.from(document.querySelectorAll("[aria-invalid='true']")).map((field) => ({
    name: field.getAttribute("name"),
    describedBy: field.getAttribute("aria-describedby"),
  })),
}));
if (emptyForm.activeName !== "name" || emptyForm.errors.length !== 4 || emptyForm.invalid.length !== 4) {
  failures.push(`Empty form validation failed: ${JSON.stringify(emptyForm)}`);
}

await functionalPage.type("input[name='name']", "عميل تجريبي");
await functionalPage.type("input[name='company']", "مشروع تجريبي");
await functionalPage.type("input[name='phone']", "0500000000");
await functionalPage.select("select[name='service']", "الاستراتيجية والهوية");
await functionalPage.type("textarea[name='brief']", "نبذة اختبار عامة للتحقق من تجهيز رسالة البريد فقط.");
await functionalPage.click("button[type='submit']");
await new Promise((resolve) => setTimeout(resolve, 100));
const preparedHref = await functionalPage.$eval("[data-testid='prepared-email']", (link) => link.getAttribute("href"));
const preparedUrl = new URL(preparedHref);
const preparedMail = {
  recipient: preparedUrl.pathname,
  subject: preparedUrl.searchParams.get("subject"),
  body: preparedUrl.searchParams.get("body"),
  values: await functionalPage.evaluate(() => Object.fromEntries(
    Array.from(document.querySelectorAll(".project-form [name]")).map((field) => [field.getAttribute("name"), field.value]),
  )),
};
if (preparedMail.recipient !== "soghagency@gmail.com") failures.push(`Wrong mail recipient: ${preparedMail.recipient}`);
for (const expected of ["عميل تجريبي", "مشروع تجريبي", "0500000000", "الاستراتيجية والهوية", "نبذة اختبار عامة"]) {
  if (!preparedMail.body.includes(expected) && !preparedMail.subject.includes(expected)) failures.push(`Prepared email omitted: ${expected}`);
}

const accessibility = await functionalPage.evaluate(() => {
  const root = document.documentElement;
  const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6"));
  const levels = headings.map((heading) => Number(heading.tagName.slice(1)));
  const headingSkips = levels.slice(1).filter((level, index) => level > levels[index] + 1);
  const controls = Array.from(document.querySelectorAll("a,button,input,select,textarea"));
  const unnamedControls = controls.filter((control) => !(
    control.getAttribute("aria-label")
    || control.textContent?.trim()
    || control.labels?.[0]?.textContent?.trim()
    || control.querySelector?.("img[alt]")?.getAttribute("alt")
  )).length;
  const labelsMissing = Array.from(document.querySelectorAll("input,select,textarea"))
    .filter((field) => !field.labels?.length).length;
  const svgNamesMissing = Array.from(document.querySelectorAll("svg"))
    .filter((svg) => svg.getAttribute("aria-hidden") !== "true" && !(svg.getAttribute("aria-label") && svg.getAttribute("role") === "img")).length;
  const links = Array.from(document.querySelectorAll("a[href]")).map((link) => link.getAttribute("href"));

  return {
    lang: root.lang,
    dir: root.dir,
    title: document.title,
    description: document.querySelector("meta[name='description']")?.content ?? "",
    robots: document.querySelector("meta[name='robots']")?.content ?? "",
    canonical: document.querySelector("link[rel='canonical']")?.href ?? "",
    ogUrl: document.querySelector("meta[property='og:url']")?.content ?? "",
    h1Count: document.querySelectorAll("h1").length,
    headingSkips: headingSkips.length,
    unnamedControls,
    labelsMissing,
    svgNamesMissing,
    skipTarget: document.querySelector(".skip-link")?.getAttribute("href"),
    links,
    formAction: document.querySelector("form")?.getAttribute("action"),
    localStorageEntries: localStorage.length,
  };
});
if (accessibility.lang !== "ar" || accessibility.dir !== "rtl") failures.push("Document language/direction failed");
if (!accessibility.title || !accessibility.description || accessibility.h1Count !== 1 || accessibility.headingSkips) failures.push("Document outline/meta failed");
if (accessibility.unnamedControls || accessibility.labelsMissing || accessibility.svgNamesMissing) failures.push(`Accessible names failed: ${JSON.stringify(accessibility)}`);
if (accessibility.skipTarget !== "#main") failures.push("Skip target failed");
if (accessibility.robots !== "noindex, nofollow" || accessibility.canonical || accessibility.ogUrl) failures.push("Temporary launch metadata failed");
if (accessibility.formAction || accessibility.localStorageEntries) failures.push("Form storage/backend constraint failed");

const forbiddenLinks = accessibility.links.filter((href) => /wa\.me|whatsapp|linkedin|x\.com|sales-kit|brand-hub/i.test(href));
if (forbiddenLinks.length) failures.push(`Forbidden links: ${forbiddenLinks.join(", ")}`);

await functionalPage.close();
if (consoleErrors.length) failures.push(...consoleErrors.map((error) => `console: ${error}`));

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  responsive,
  functional: { skipFocus, menuOpen, menuEscaped, menuLinkSelected, emptyForm, preparedMail },
  accessibility,
  consoleErrors,
  failures,
};
writeFileSync(join(out, "release-qa-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
await browser.close();

if (failures.length) {
  console.error(`FAILED (${failures.length})\n- ${failures.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log("PASS final production release QA.");
}
