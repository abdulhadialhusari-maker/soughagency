/**
 * Selected Work QA.
 *
 *   npm run qa:work
 *   SITE_URL=http://127.0.0.1:5182 npm run qa:work
 *
 * This gate exists for one reason above all the others: a case study is a
 * published claim about a client, so the things that must never regress are
 * not visual. They are that every rendered project is one the data marks
 * approved, that nothing belonging to a pending project is reachable in the
 * build, that every link goes somewhere real, and that no result or figure has
 * crept into the copy.
 *
 * It reads the built `dist/` for the rights checks — what actually ships is the
 * only thing that matters there — and the running page for the rendered ones.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = process.env.SITE_URL ?? "http://127.0.0.1:5181";
const CHROME =
  process.env.CHROME_PATH ??
  "C:/Program Files/Google/Chrome/Application/chrome.exe";
const WIDTHS = [1440, 1024, 768, 390, 360];

/** the approved order, asserted so a reorder cannot land unnoticed */
const EXPECTED_ORDER = ["01", "02", "03", "04"];
const EXPECTED_IDS = ["acadify", "obaid-abid", "dar-ward", "mutas"];

/* digits that would indicate a published result. Arabic-Indic included, because
   a fabricated metric is just as fabricated in ٪ as in %. */
const RESULT_SHAPES = [
  /[+\-]?\s?[\d٠-٩]{1,3}[.,٫]?[\d٠-٩]*\s?%/,
  /[+\-]?\s?%\s?[\d٠-٩]/,
  /[\d٠-٩]{1,3}([,،][\d٠-٩]{3})+/, // 5,000 / ٥٬٠٠٠
  /\b(ROAS|ROI|CTR|CPC|CPA|CPM)\b/i,
  /(ر\.?\s?س|SAR|ريال)\s?[\d٠-٩]/,
  /[\d٠-٩]\s?(ر\.?\s?س|SAR|ريال)/,
];

const problems = [];
const note = (m) => problems.push(m);

/* ---------------------------------------------------------------- data ---- */

const dataSrc = readFileSync(join(root, "src/data/work.ts"), "utf8");
/* Count inside the STUDIES array only. The type declaration above it also
   contains `publication:` and `rightSource:`, and counting the whole file
   reported one study more than exists. */
const arrayStart = dataSrc.indexOf("const STUDIES");
const arrayEnd = dataSrc.indexOf("\n];", arrayStart);
const studiesSrc = dataSrc.slice(arrayStart, arrayEnd);
const approvedCount = (studiesSrc.match(/publication: "approved"/g) ?? []).length;
const pendingCount = (studiesSrc.match(/publication: "pending"/g) ?? []).length;

// every study must declare where its right comes from
const studyCount = (studiesSrc.match(/^\s{4}id: "/gm) ?? []).length;
const rightCount = (studiesSrc.match(/rightSource:/g) ?? []).length;
if (rightCount !== studyCount) {
  note(`${studyCount} studies but ${rightCount} declare a rightSource`);
}

/* --------------------------------------------------- what actually ships --- */

const dist = join(root, "dist");
const distWork = join(dist, "work");
const shipped = existsSync(distWork) ? readdirSync(distWork) : [];

// collect the media paths of pending studies; none may exist in the bundle
const pendingBlocks = studiesSrc
  .split(/\{\s*\n\s{4}id: "/)
  .filter((b) => /publication: "pending"/.test(b));
for (const block of pendingBlocks) {
  for (const [, src] of block.matchAll(/src9?0?0?: "(\/work\/[^"]+)"/g)) {
    const file = src.split("/").pop();
    if (shipped.includes(file)) {
      note(`PENDING media shipped in dist/work: ${file}`);
    }
  }
}

/* ------------------------------------------------------------ the page ---- */

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--force-prefers-reduced-motion", "--hide-scrollbars"],
});

let referenced = [];

try {
  for (const width of WIDTHS) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: 900 });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    const failedRequests = [];
    page.on("requestfailed", (r) => failedRequests.push(r.url()));
    page.on("response", (r) => {
      // 304 is a successful revalidation; only real errors count
      if (r.url().includes("/work/") && !r.ok() && r.status() !== 304) {
        failedRequests.push(`${r.status()} ${r.url()}`);
      }
    });

    await page.goto(SITE, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
    // commit lazy media so a broken source cannot hide below the fold
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await new Promise((r) => setTimeout(r, 400));

    const result = await page.evaluate(() => {
      const section = document.querySelector("#work");
      if (!section) return { missing: true };
      const studies = [...section.querySelectorAll(".case")].map((el) => ({
        index: el.querySelector(".case__index")?.textContent.trim() ?? "",
        name: el.querySelector(".case__name")?.textContent.trim() ?? "",
        id: el.querySelector("[id^='work-']")?.id.replace(/^work-|-title$/g, "") ?? "",
        href: el.querySelector(".case__link")?.getAttribute("href") ?? null,
        target: el.querySelector(".case__link")?.getAttribute("target") ?? null,
        rel: el.querySelector(".case__link")?.getAttribute("rel") ?? null,
        text: el.textContent.replace(/\s+/g, " ").trim(),
        // the sourced figures, kept apart from the prose
        metricsText: (el.querySelector(".case__metrics")?.textContent ?? "")
          .replace(/\s+/g, " ")
          .trim(),
        metricValues: [...el.querySelectorAll(".case__metric-value")].map((n) =>
          n.textContent.trim(),
        ),
        metricLabels: [...el.querySelectorAll(".case__metric-label")].map((n) =>
          n.textContent.trim(),
        ),
        metricsNote: el.querySelector(".case__metrics-note")?.textContent.trim() ?? "",
        imgs: [...el.querySelectorAll("img")].map((i) => ({
          src: new URL(i.getAttribute("src"), location.href).pathname,
          alt: i.getAttribute("alt") ?? "",
          natural: i.naturalWidth,
          hasDims: Boolean(i.getAttribute("width") && i.getAttribute("height")),
          renderedW: Math.round(i.getBoundingClientRect().width),
          loading: i.getAttribute("loading"),
        })),
      }));
      // the work section must not introduce a clickable div
      const fakeButtons = [...section.querySelectorAll("div[onclick], li[onclick]")].length;
      return {
        studies,
        fakeButtons,
        headingLevels: [...section.querySelectorAll("h2,h3,h4")].map((h) => h.tagName),
        overflow:
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
        // Work must sit between Method and Intelligence
        order: [...document.querySelector("main").children].map((s) => {
          const own = [...s.classList].find(
            (c) =>
              c !== "section" &&
              c !== "on-ink" &&
              !c.startsWith("section--") &&
              !c.startsWith("is-") &&
              !c.startsWith("motion"),
          );
          return s.id || own || "?";
        }),
      };
    });

    if (result.missing) {
      note(`${width}px: #work is not in the DOM`);
      await page.close();
      continue;
    }

    if (width === WIDTHS[0]) {
      referenced = result.studies.flatMap((s) => s.imgs.map((i) => i.src));

      if (result.studies.length !== approvedCount) {
        note(`${result.studies.length} studies rendered, ${approvedCount} approved in data`);
      }
      const order = result.studies.map((s) => s.index);
      if (order.join(",") !== EXPECTED_ORDER.slice(0, order.length).join(",")) {
        note(`project order is ${order.join(",")} — expected ${EXPECTED_ORDER.join(",")}`);
      }
      const ids = result.studies.map((s) => s.id);
      if (new Set(ids).size !== ids.length) note(`duplicate project ids: ${ids.join(",")}`);
      for (const id of ids) {
        if (!EXPECTED_IDS.includes(id)) note(`unexpected project id "${id}"`);
      }

      const idx = result.order.indexOf("work");
      if (idx < 1 || result.order[idx - 1] !== "method") {
        note(`Work does not follow Method — order: ${result.order.join(" > ")}`);
      }
      if (result.order[idx + 1] !== "intel") {
        note(`Work is not followed by Intelligence — order: ${result.order.join(" > ")}`);
      }
    }

    for (const s of result.studies) {
      // links: real destination, safely opened
      if (s.href !== null) {
        if (!/^https:\/\//.test(s.href)) note(`${s.index}: non-https href "${s.href}"`);
        if (s.target === "_blank" && !/noopener/.test(s.rel ?? "")) {
          note(`${s.index}: target=_blank without rel=noopener`);
        }
      }
      // media: resolves, described, sized, and not blown up past its source
      for (const img of s.imgs) {
        if (img.natural === 0) note(`${width}px ${s.index}: image failed to load ${img.src}`);
        if (!img.alt.trim()) note(`${width}px ${s.index}: image without alt text`);
        if (!img.hasDims) note(`${s.index}: image without width/height (layout shift)`);
        if (img.natural && img.renderedW > img.natural * 1.35) {
          note(
            `${width}px ${s.index}: ${img.src} rendered ${img.renderedW}px from a ${img.natural}px source`,
          );
        }
      }
      /*
       * Figures must have provenance.
       *
       * Prose — statement, description, capabilities — may carry no figure at
       * all: there is no source behind a number written into a sentence. The
       * only numbers allowed are the ones declared in this study's `metrics`
       * and `metricsNote`, which are quoted from a client report, and each
       * rendered value is checked back against that declaration. So an invented
       * number cannot reach the page through either route.
       */
      const prose = s.metricsText ? s.text.replace(s.metricsText, " ") : s.text;
      for (const shape of RESULT_SHAPES) {
        const hit = prose.match(shape);
        if (hit) note(`${s.index}: unsourced figure in prose "${hit[0].trim()}"`);
      }

      if (s.metricValues.length) {
        // every displayed figure must exist verbatim in the data
        for (const v of s.metricValues) {
          if (!studiesSrc.includes(`value: "${v}"`)) {
            note(`${s.index}: displayed figure "${v}" is not declared in work.ts`);
          }
        }
        // figures without their context sentence invite the wrong noun
        if (!s.metricsNote) {
          note(`${s.index}: metrics rendered without the context note`);
        }
        // a WhatsApp visit is a visit — never upgraded in the label
        for (const label of s.metricLabels) {
          if (/(حجز|حجوزات|عميل|عملاء|مبيع|إيراد|lead|booking|customer|revenue|sale)/i.test(label)) {
            note(`${s.index}: metric label overclaims — "${label}"`);
          }
        }
        // and the study must say where the figures came from
        const block = studiesSrc.split('id: "').find((b) => b.startsWith(s.id));
        // bounded [\s\S] rather than `.`: a long rightSource wraps onto its own
        // line, and `.` stops at the newline
        if (block && !/rightSource:[\s\S]{0,200}?(report|تقرير|contract)/i.test(block)) {
          note(`${s.index}: study shows figures but rightSource names no source for them`);
        }
      }
    }

    if (result.fakeButtons) note(`${width}px: ${result.fakeButtons} clickable non-interactive element(s)`);
    if (result.overflow > 0) note(`${width}px: horizontal overflow ${result.overflow}px`);
    for (const f of failedRequests) note(`${width}px: request failed ${f}`);
    for (const e of errors) note(`${width}px: console ${e}`);

    console.log(
      `${problems.length ? "    " : "OK  "} ${String(width).padStart(5)}px  ${result.studies.length} studies  ` +
        `${result.studies.reduce((n, s) => n + s.imgs.length, 0)} images  overflow ${result.overflow}px`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}

/* every shipped file must be referenced by an approved study */
const referencedNames = new Set(referenced.map((p) => p.split("/").pop()));
for (const file of shipped) {
  if (!referencedNames.has(file)) {
    // a responsive source named in srcset is legitimate even if `src` differs
    if (!dataSrc.includes(file)) note(`orphaned file in dist/work: ${file}`);
  }
}

console.log(
  `\n  approved ${approvedCount} · pending ${pendingCount} · shipped files ${shipped.length}`,
);
if (pendingCount) {
  console.log(`  ${pendingCount} study(ies) held back — their media is not in the bundle`);
}
for (const p of problems) console.log(`  ! ${p}`);
console.log(problems.length ? "\nFAIL Selected Work QA." : "\nPASS Selected Work QA.");
process.exit(problems.length ? 1 : 0);
