/**
 * Arabic heading QA.
 *
 *   node scripts/arabic-typo-qa.mjs
 *   SITE_URL=http://127.0.0.1:5182 node scripts/arabic-typo-qa.mjs
 *
 * Line boxes are not the thing to measure. Alexandria stacks fatha/sukun above
 * the cap line and drops a deep tail on غ/ج/ق, and both sit OUTSIDE the line
 * box at display leading — so two headings can have a comfortable line-box gap
 * and still have their ink touching.
 *
 * The reported ink-gap column uses canvas `measureText`, whose
 * actualBoundingBoxAscent/Descent covers the diacritics and the tails, placed
 * against each line's own baseline. It is reported, not asserted: Arabic lines
 * interleave horizontally, so a negative box overlap does not by itself mean
 * the letters touch. `scripts/heading-ink-qa.mjs` renders the crops for that
 * judgement.
 *
 * It also checks the guard rails the design depends on: leading inside the
 * 1.22–1.32 band, tracking left at normal for Arabic, descriptive copy in the
 * 1.65–1.8 band, no ancestor clipping a heading, and no horizontal scroll.
 */
import puppeteer from "puppeteer-core";

const SITE = process.env.SITE_URL ?? "http://127.0.0.1:5181";
const CHROME =
  process.env.CHROME_PATH ??
  "C:/Program Files/Google/Chrome/Application/chrome.exe";

const WIDTHS = [360, 390, 768, 1024, 1440];

/** minimum clear space between the ink of two stacked lines, in px */
const MIN_INK_GAP = 1.5;

const LEADING_BAND = [1.22, 1.32];
const PROSE_BAND = [1.65, 1.8];

const audit = ({ MIN_INK_GAP, LEADING_BAND, PROSE_BAND }) => {
  const round = (v) => Math.round(v * 10) / 10;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const problems = [];
  const headings = [];

  for (const display of document.querySelectorAll(".display")) {
    const cs = getComputedStyle(display);
    const fontSize = parseFloat(cs.fontSize);
    const lineHeight = parseFloat(cs.lineHeight);
    const exactRatio = lineHeight / fontSize;
    const ratio = Math.round(exactRatio * 100) / 100;
    const label = (display.getAttribute("aria-label") ?? display.textContent)
      .trim()
      .slice(0, 34);

    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;

    // leading band
    if (exactRatio < LEADING_BAND[0] || exactRatio > LEADING_BAND[1]) {
      problems.push(`leading ${ratio} outside ${LEADING_BAND.join("–")} — "${label}"`);
    }

    // Arabic must not carry negative tracking
    const tracking = cs.letterSpacing;
    if (tracking !== "normal" && parseFloat(tracking) < 0) {
      problems.push(`negative letter-spacing ${tracking} — "${label}"`);
    }

    // no ancestor may clip the ink
    for (let el = display.parentElement; el && el !== document.body; el = el.parentElement) {
      const o = getComputedStyle(el);
      if (
        (o.overflowY === "hidden" || o.overflowY === "clip") &&
        el.getBoundingClientRect().height > 0
      ) {
        problems.push(`clipped by .${el.className.split(" ")[0] || el.tagName} — "${label}"`);
        break;
      }
    }

    // ink overlap between consecutive lines
    const lines = [...display.querySelectorAll(".display__line")];
    const inks = lines.map((line) => {
      const rect = line.getBoundingClientRect();
      const m = ctx.measureText(line.textContent);
      // the baseline sits half the leading below the line-box top, plus ascent
      const half = (lineHeight - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2;
      const baseline = rect.top + half + m.fontBoundingBoxAscent;
      return {
        text: line.textContent.trim(),
        top: baseline - m.actualBoundingBoxAscent,
        bottom: baseline + m.actualBoundingBoxDescent,
      };
    });

    let tightest = null;
    for (let i = 0; i < inks.length - 1; i++) {
      const gap = round(inks[i + 1].top - inks[i].bottom);
      if (tightest === null || gap < tightest) tightest = gap;
    }

    headings.push({
      label,
      fontSize: round(fontSize),
      ratio,
      tracking,
      lines: lines.length,
      inkGap: tightest,
      colWidth: round(display.parentElement.getBoundingClientRect().width),
      fill: round(
        (Math.max(...lines.map((l) => l.getBoundingClientRect().width), 0) /
          display.parentElement.getBoundingClientRect().width) * 100,
      ),
    });
  }

  // descriptive copy leading
  for (const p of document.querySelectorAll(".lead")) {
    const cs = getComputedStyle(p);
    const r = round(parseFloat(cs.lineHeight) / parseFloat(cs.fontSize));
    if (r < PROSE_BAND[0] || r > PROSE_BAND[1]) {
      problems.push(`prose leading ${r} outside ${PROSE_BAND.join("–")}`);
    }
  }

  // client logos must fit their slot, stay inert, and be announced exactly once
  const cells = [...document.querySelectorAll(".clients__item")];
  for (const cell of cells) {
    const img = cell.querySelector("img");
    if (!img) continue;
    const c = cell.getBoundingClientRect();
    const i = img.getBoundingClientRect();
    // a slot that clips its own logo is the defect the page-level overflow
    // check cannot see, now that the marquee track legitimately overhangs
    if (i.width > c.width + 0.5 || i.height > c.height + 0.5) {
      problems.push(`logo overflows its slot — ${img.alt || "(clone)"}`);
    }
    if (getComputedStyle(cell).cursor === "pointer") {
      problems.push(`pointer cursor on client slot — ${img.alt || "(clone)"}`);
    }
  }

  const sequences = [...document.querySelectorAll(".clients__seq")];
  const real = sequences.filter((s) => s.getAttribute("aria-hidden") !== "true");
  const clones = sequences.filter((s) => s.getAttribute("aria-hidden") === "true");

  if (real.length !== 1) {
    problems.push(`${real.length} announced logo sequences — expected exactly 1`);
  }
  for (const seq of real) {
    if (!seq.getAttribute("aria-label")) problems.push("announced sequence has no aria-label");
    for (const img of seq.querySelectorAll("img")) {
      if (!img.alt.trim()) problems.push("announced client logo without alt text");
    }
  }
  // duplicates exist for the loop only; they must not reach assistive tech
  for (const seq of clones) {
    for (const img of seq.querySelectorAll("img")) {
      if (img.alt !== "") problems.push(`duplicated logo carries alt "${img.alt}"`);
    }
  }
  if (clones.length < 1) problems.push("marquee has no duplicated sequence — the loop will gap");

  if (document.querySelectorAll(".clients a, .clients button, .clients [tabindex]").length) {
    problems.push("interactive element inside the clients section");
  }

  const overflow =
    document.documentElement.scrollWidth - document.documentElement.clientWidth;
  if (overflow > 0) problems.push(`horizontal overflow ${overflow}px`);

  return {
    problems,
    headings,
    logos: cells.length,
    announced: real.reduce((n, seq) => n + seq.querySelectorAll("img").length, 0),
    overflow,
  };
};

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--force-prefers-reduced-motion", "--hide-scrollbars"],
});

let failed = false;

try {
  for (const width of WIDTHS) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: 900 });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

    await page.goto(SITE, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);

    const result = await page.evaluate(audit, { MIN_INK_GAP, LEADING_BAND, PROSE_BAND });
    const bad = result.problems.length > 0 || errors.length > 0;
    if (bad) failed = true;

    console.log(`\n${bad ? "FAIL" : "OK  "} ${width}px — ${result.logos} logo slots (${result.announced} announced), overflow ${result.overflow}px`);
    for (const h of result.headings) {
      console.log(
        `      ${String(h.fontSize).padStart(5)}px  lh ${h.ratio}  ${String(h.tracking).padStart(6)}  ` +
          `ink-gap ${h.inkGap === null ? "  —" : String(h.inkGap).padStart(4)}px  fill ${String(h.fill).padStart(4)}%  ${h.label}`,
      );
    }
    for (const p of result.problems) console.log(`      ! ${p}`);
    for (const e of errors) console.log(`      ! console: ${e}`);
    await page.close();
  }
} finally {
  await browser.close();
}

console.log(failed ? "\nFAIL Arabic typography QA." : "\nPASS Arabic typography QA.");
process.exit(failed ? 1 : 0);
