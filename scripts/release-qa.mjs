/**
 * Final production release gate for the SOGH public website.
 *
 * Run it against a production preview, not the dev server:
 *   npm run build && npm run preview          (serves 127.0.0.1:5181)
 *   SITE_URL=http://127.0.0.1:5181 npm run qa:release
 *
 * It checks, in one pass:
 *   - responsive integrity across the release width matrix (no horizontal
 *     overflow, nothing crossing the viewport edge, no broken images);
 *   - the functional paths that carry the conversion (skip link, mobile menu,
 *     form validation, the composed mail hand-off);
 *   - the accessibility floor (one h1, no heading skips, every control named,
 *     every form field labelled, every meaningful svg named);
 *   - the launch metadata and the content rules that must never regress
 *     (client logos stay non-interactive, no unapproved contact channel, no
 *     backend or storage behind the form).
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "qa-previews", process.env.RELEASE_QA_DIR ?? "release");
const baseUrl = process.env.SITE_URL ?? "http://127.0.0.1:5181";
const ORIGIN = "https://soghagency.com";

const viewports = [
  { width: 320, height: 700 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 560, height: 800 },
  { width: 768, height: 900 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
];

const executablePath = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
].filter(Boolean).find((path) => existsSync(path));

if (!executablePath) throw new Error("No Chrome/Edge found. Set CHROME_PATH.");
mkdirSync(out, { recursive: true });

const browser = await puppeteer.launch({
  executablePath,
  headless: "new",
  protocolTimeout: 120_000,
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
  // below-the-fold images are lazy by design, so promote them for the audit —
  // otherwise "not yet requested" is indistinguishable from "failed to load"
  await page.evaluate(() => {
    for (const image of document.images) image.loading = "eager";
  });
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        const pending = [...document.images].filter((image) => !image.complete);
        if (!pending.length) return resolve();
        let left = pending.length;
        const done = () => --left <= 0 && resolve();
        for (const image of pending) {
          image.addEventListener("load", done, { once: true });
          image.addEventListener("error", done, { once: true });
        }
        setTimeout(resolve, 5000);
      }),
  );
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  // let the one-shot entrance settle before anything is measured
  await new Promise((resolve) => setTimeout(resolve, 1900));
}

/** Click without the sticky header intercepting the hit at the top of the view. */
async function clickClear(page, selector) {
  await page.evaluate((sel) => {
    document.querySelector(sel).scrollIntoView({ block: "center", behavior: "instant" });
  }, selector);
  await new Promise((resolve) => setTimeout(resolve, 120));
  await page.click(selector);
}

/* ---------------------------------------------------------------- responsive */

for (const viewport of viewports) {
  const page = await browser.newPage();
  const label = `${viewport.width}x${viewport.height}`;
  monitor(page, label);
  await page.setViewport({ ...viewport, deviceScaleFactor: 1 });
  await load(page);

  const result = await page.evaluate((tested) => {
    const html = document.documentElement;
    const visible = (el) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden"
        && rect.width > 0 && rect.height > 0;
    };
    const name = (el) => {
      if (el.id) return `${el.tagName.toLowerCase()}#${el.id}`;
      const classes = Array.from(el.classList).slice(0, 3).join(".");
      return `${el.tagName.toLowerCase()}${classes ? `.${classes}` : ""}`;
    };
    return {
      viewport: tested,
      clientWidth: html.clientWidth,
      horizontalOverflow: html.scrollWidth - html.clientWidth,
      devicePixelRatio,
      visualScale: window.visualViewport?.scale ?? 1,
      offenders: Array.from(document.querySelectorAll("body *"))
        .filter((el) => {
          if (!visible(el)) return false;
          const rect = el.getBoundingClientRect();
          if (rect.left >= -0.5 && rect.right <= html.clientWidth + 0.5) return false;
          // Content that sits past the edge INSIDE a clipping ancestor is
          // deliberate — the client marquee's track is wider than the screen by
          // design and is cut by its own viewport. It cannot widen the
          // document, which `horizontalOverflow` above already proves. Only
          // unclipped overhang is a defect.
          for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
            const o = getComputedStyle(p);
            const clipsX = o.overflowX === "hidden" || o.overflowX === "clip"
              || o.overflowX === "auto" || o.overflowX === "scroll";
            if (clipsX) return false;
          }
          return true;
        })
        .map(name),
      brokenImages: Array.from(document.images)
        .filter((image) => !image.complete || image.naturalWidth === 0)
        .map((image) => image.getAttribute("src")),
      // the primary action has to be reachable without scrolling
      ctaAboveFold: (() => {
        const cta = document.querySelector(".hero__actions .btn");
        return cta ? cta.getBoundingClientRect().bottom <= innerHeight : false;
      })(),
      fontStatus: document.fonts.status,
    };
  }, viewport);

  if (result.horizontalOverflow !== 0) {
    failures.push(`${label}: horizontal overflow ${result.horizontalOverflow}px`);
  }
  if (result.offenders.length) {
    failures.push(`${label}: edge offenders ${result.offenders.join(", ")}`);
  }
  if (result.brokenImages.length) {
    failures.push(`${label}: broken images ${result.brokenImages.join(", ")}`);
  }
  if (result.fontStatus !== "loaded") failures.push(`${label}: fonts did not settle`);
  if (result.devicePixelRatio !== 1 || result.visualScale !== 1) {
    failures.push(`${label}: browser zoom is not 100%`);
  }
  if (!result.ctaAboveFold) failures.push(`${label}: primary CTA is below the fold`);

  responsive.push(result);
  console.log(
    `OK ${label} | overflow ${result.horizontalOverflow}px | offenders ${result.offenders.length} | CTA above fold ${result.ctaAboveFold}`,
  );
  await page.close();
}

/* ---------------------------------------------------------------- functional */

const page = await browser.newPage();
monitor(page, "functional");
await page.setViewport({ width: 360, height: 800, deviceScaleFactor: 1 });
await load(page);

// 1. the skip link is the first tab stop and becomes visible when focused
await page.keyboard.press("Tab");
await new Promise((resolve) => setTimeout(resolve, 300));
const skipFocus = await page.evaluate(() => {
  const el = document.activeElement;
  const style = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  return {
    className: el.className,
    href: el.getAttribute("href"),
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

// 2. mobile menu: opens, closes on Escape with focus returned, closes on select
const navSelector = "[data-testid='menu-toggle']";
await page.click(navSelector);
const menuOpen = await page.evaluate(() => ({
  expanded: document.querySelector("[data-testid='menu-toggle']").getAttribute("aria-expanded"),
  visibleLinks: Array.from(document.querySelectorAll(".site-nav a"))
    .filter((link) => link.getClientRects().length).length,
}));
await page.keyboard.press("Escape");
const menuEscaped = await page.evaluate(() => ({
  expanded: document.querySelector("[data-testid='menu-toggle']").getAttribute("aria-expanded"),
  stillFocusable: Array.from(document.querySelectorAll(".site-nav a"))
    .filter((link) => link.getClientRects().length).length,
  focusReturned: document.activeElement?.classList.contains("menu-toggle") ?? false,
}));
await page.click(navSelector);
await page.click(".site-nav a[href='#method']");
const menuLinkSelected = await page.evaluate(() => ({
  hash: location.hash,
  expanded: document.querySelector("[data-testid='menu-toggle']").getAttribute("aria-expanded"),
}));

// 5 sections + the CTA; "أعمالنا" joins only once a case study is published
const expectedLinks = await page.evaluate(
  () => document.querySelectorAll(".site-nav__list a").length + 1,
);
if (menuOpen.expanded !== "true" || menuOpen.visibleLinks !== expectedLinks) {
  failures.push(`Mobile menu open failed: ${JSON.stringify(menuOpen)}`);
}
if (menuEscaped.expanded !== "false" || menuEscaped.stillFocusable !== 0 || !menuEscaped.focusReturned) {
  failures.push(`Mobile menu Escape failed: ${JSON.stringify(menuEscaped)}`);
}
if (menuLinkSelected.hash !== "#method" || menuLinkSelected.expanded !== "false") {
  failures.push(`Mobile menu link failed: ${JSON.stringify(menuLinkSelected)}`);
}

// 3. an empty submit names every missing field and moves focus to the first
await clickClear(page, "button[type='submit']");
const emptyForm = await page.evaluate(() => ({
  activeName: document.activeElement?.getAttribute("name"),
  errors: Array.from(document.querySelectorAll(".form__error"))
    .map((error) => ({ id: error.id, text: error.textContent.trim() })),
  invalid: Array.from(document.querySelectorAll("[aria-invalid='true']"))
    .map((field) => ({
      name: field.getAttribute("name"),
      describedBy: field.getAttribute("aria-describedby"),
    })),
}));
if (emptyForm.activeName !== "name" || emptyForm.errors.length !== 5 || emptyForm.invalid.length !== 5) {
  failures.push(`Empty form validation failed: ${JSON.stringify(emptyForm)}`);
}
if (emptyForm.invalid.some((field) => !field.describedBy)) {
  failures.push("A field flagged invalid is not described by its message");
}

// 4. a malformed phone or email is caught before the mail is composed
await page.type("input[name='name']", "عميل تجريبي");
await page.type("input[name='phone']", "123");
await page.type("input[name='email']", "not-an-email");
await page.select("select[name='service']", "الاستراتيجية والنمو");
await page.type("textarea[name='brief']", "نبذة اختبار للتحقق من تجهيز الرسالة.");
await clickClear(page, "button[type='submit']");
const malformed = await page.evaluate(() => ({
  errors: Array.from(document.querySelectorAll(".form__error")).map((e) => e.textContent.trim()),
  prepared: Boolean(document.querySelector("[data-testid='prepared-email']")),
}));
if (malformed.errors.length !== 2 || malformed.prepared) {
  failures.push(`Format validation failed: ${JSON.stringify(malformed)}`);
}

// 5. a complete brief composes the mail with every field, and sends nowhere else
await page.evaluate(() => {
  const form = document.querySelector(".form");
  for (const name of ["phone", "email"]) {
    const field = form.elements[name];
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(field, "");
    field.dispatchEvent(new Event("input", { bubbles: true }));
  }
});
await page.type("input[name='company']", "مشروع تجريبي");
await page.type("input[name='phone']", "0500000000");
await page.type("input[name='email']", "client@example.com");
await clickClear(page, "button[type='submit']");
await new Promise((resolve) => setTimeout(resolve, 150));

const preparedHref = await page.$eval("[data-testid='prepared-email']", (link) =>
  link.getAttribute("href"),
);
const preparedUrl = new URL(preparedHref);
const preparedMail = {
  recipient: preparedUrl.pathname,
  subject: preparedUrl.searchParams.get("subject"),
  body: preparedUrl.searchParams.get("body"),
};
if (preparedMail.recipient !== "soghagency@gmail.com") {
  failures.push(`Wrong mail recipient: ${preparedMail.recipient}`);
}
for (const expected of [
  "عميل تجريبي",
  "مشروع تجريبي",
  "0500000000",
  "client@example.com",
  "الاستراتيجية والنمو",
  "نبذة اختبار",
]) {
  if (!preparedMail.body.includes(expected) && !preparedMail.subject.includes(expected)) {
    failures.push(`Prepared email omitted: ${expected}`);
  }
}

/* --------------------------------------------- accessibility, meta, content */

const audit = await page.evaluate((origin) => {
  const html = document.documentElement;
  const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6"));
  const levels = headings.map((h) => Number(h.tagName.slice(1)));

  const controls = Array.from(document.querySelectorAll("a,button,input,select,textarea"));
  const unnamedControls = controls.filter((control) => !(
    control.getAttribute("aria-label")
    || control.textContent?.trim()
    || control.labels?.[0]?.textContent?.trim()
    || control.querySelector?.("img[alt]")?.getAttribute("alt")
  )).length;

  const clientLogos = Array.from(document.querySelectorAll(".clients__item"));

  return {
    lang: html.lang,
    dir: html.dir,
    title: document.title,
    description: document.querySelector("meta[name='description']")?.content ?? "",
    robots: document.querySelector("meta[name='robots']")?.content ?? "",
    canonical: document.querySelector("link[rel='canonical']")?.href ?? "",
    ogUrl: document.querySelector("meta[property='og:url']")?.content ?? "",
    ogImage: document.querySelector("meta[property='og:image']")?.content ?? "",
    twitterCard: document.querySelector("meta[name='twitter:card']")?.content ?? "",
    jsonLdTypes: Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .flatMap((node) => {
        try {
          const data = JSON.parse(node.textContent);
          return (data["@graph"] ?? [data]).flatMap((entry) => entry["@type"]);
        } catch {
          return ["INVALID_JSON"];
        }
      }),
    h1Count: document.querySelectorAll("h1").length,
    headingSkips: levels.slice(1).filter((level, i) => level > levels[i] + 1).length,
    unnamedControls,
    labelsMissing: Array.from(document.querySelectorAll("input,select,textarea"))
      .filter((field) => !field.labels?.length).length,
    svgNamesMissing: Array.from(document.querySelectorAll("svg")).filter(
      (svg) => svg.getAttribute("aria-hidden") !== "true"
        && !(svg.getAttribute("aria-label") && svg.getAttribute("role") === "img"),
    ).length,
    imagesMissingAlt: Array.from(document.images)
      .filter((image) => image.getAttribute("alt") === null).length,
    skipTarget: document.querySelector(".skip-link")?.getAttribute("href"),
    links: Array.from(document.querySelectorAll("a[href]")).map((a) => a.getAttribute("href")),
    // content rules that must not regress
    clientLogoCount: clientLogos.length,
    clientLogosInteractive: clientLogos.filter(
      (item) => item.querySelector("a, button") || getComputedStyle(item).cursor === "pointer",
    ).length,
    clientLogosWithVisibleText: clientLogos.filter(
      (item) => (item.textContent ?? "").trim().length > 0,
    ).length,
    caseStudySection: Boolean(document.querySelector("#work")),
    formAction: document.querySelector("form")?.getAttribute("action"),
    localStorageEntries: localStorage.length,
    absoluteOrigin: origin,
  };
}, ORIGIN);

if (audit.lang !== "ar" || audit.dir !== "rtl") failures.push("Document language/direction failed");
if (!audit.title || !audit.description || audit.h1Count !== 1 || audit.headingSkips) {
  failures.push(`Document outline/meta failed: ${JSON.stringify({
    title: audit.title, h1Count: audit.h1Count, headingSkips: audit.headingSkips })}`);
}
if (audit.unnamedControls || audit.labelsMissing || audit.svgNamesMissing || audit.imagesMissingAlt) {
  failures.push(`Accessible names failed: ${JSON.stringify(audit)}`);
}
if (audit.skipTarget !== "#main") failures.push("Skip target failed");

// launch metadata: the official domain is live, so indexing is open and the
// canonical, og:url and absolute og:image must all point at it
if (audit.robots.includes("noindex")) failures.push("noindex is still present");
if (audit.canonical !== `${ORIGIN}/`) failures.push(`Canonical failed: ${audit.canonical}`);
if (audit.ogUrl !== `${ORIGIN}/`) failures.push(`og:url failed: ${audit.ogUrl}`);
if (!audit.ogImage.startsWith(ORIGIN)) failures.push(`og:image is not absolute: ${audit.ogImage}`);
if (audit.twitterCard !== "summary_large_image") failures.push("twitter:card failed");
for (const type of ["Organization", "ProfessionalService", "WebSite"]) {
  if (!audit.jsonLdTypes.includes(type)) failures.push(`Structured data missing ${type}`);
}

// content rules
if (audit.clientLogoCount === 0) failures.push("Client strip rendered no logo");
if (audit.clientLogosInteractive) failures.push("A client logo is interactive");
if (audit.clientLogosWithVisibleText) failures.push("A client logo carries visible text");
if (audit.formAction || audit.localStorageEntries) {
  failures.push("Form storage/backend constraint failed");
}

// no unconfirmed contact channel may appear
const forbiddenLinks = audit.links.filter((href) =>
  /wa\.me|whatsapp|linkedin\.com|x\.com|twitter\.com/i.test(href),
);
if (forbiddenLinks.length) failures.push(`Unconfirmed channel linked: ${forbiddenLinks.join(", ")}`);

/* ------------------------------------------------------------ reduced motion */

const reducedPage = await browser.newPage();
monitor(reducedPage, "reduced-motion");
await reducedPage.emulateMediaFeatures([
  { name: "prefers-reduced-motion", value: "reduce" },
]);
await reducedPage.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await load(reducedPage);
const reducedMotion = await reducedPage.evaluate(() => ({
  // nothing may be left hidden or half-drawn when the visitor opts out
  hiddenSections: Array.from(document.querySelectorAll("main section"))
    .filter((el) => Number(getComputedStyle(el).opacity) < 0.99).length,
  hiddenBlocks: Array.from(
    document.querySelectorAll(".reveal, .method__stage, .intel__grid li, .clients__item"),
  ).filter((el) => Number(getComputedStyle(el).opacity) < 0.99).length,
  undrawnStrokes: Array.from(document.querySelectorAll("path, circle")).filter((el) => {
    const offset = getComputedStyle(el).strokeDashoffset;
    return offset && offset !== "none" && Number.parseFloat(offset) > 0;
  }).length,
}));
if (reducedMotion.hiddenSections || reducedMotion.hiddenBlocks || reducedMotion.undrawnStrokes) {
  failures.push(`Reduced motion left content hidden: ${JSON.stringify(reducedMotion)}`);
}
await reducedPage.close();
await page.close();

if (consoleErrors.length) failures.push(...consoleErrors.map((error) => `console: ${error}`));

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  responsive,
  functional: { skipFocus, menuOpen, menuEscaped, menuLinkSelected, emptyForm, malformed, preparedMail },
  audit,
  reducedMotion,
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
