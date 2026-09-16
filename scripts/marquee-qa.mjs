/**
 * Client marquee release check.
 *
 *   node scripts/marquee-qa.mjs
 *   SITE_URL=http://127.0.0.1:5182 node scripts/marquee-qa.mjs
 *
 * Runs every viewport twice — once with motion allowed and once with
 * `prefers-reduced-motion: reduce` forced — and asserts each rule the section
 * has to hold, rather than eyeballing a screenshot and calling it done.
 *
 * The aspect-ratio check is the one worth explaining: it compares each
 * rendered logo against its own intrinsic dimensions, which catches a squashed
 * or stretched mark that `object-fit: contain` would normally prevent but a
 * stray width/height rule could still cause.
 */
import puppeteer from "puppeteer-core";

const SITE = process.env.SITE_URL ?? "http://127.0.0.1:5182";
const CHROME =
  process.env.CHROME_PATH ??
  "C:/Program Files/Google/Chrome/Application/chrome.exe";

const WIDTHS = [1440, 1024, 768, 390, 360];
const EXPECTED_LOGOS = 6;

const audit = (expected) => {
  const problems = [];
  const round = (v) => Math.round(v * 100) / 100;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const viewport = document.querySelector(".clients__viewport");
  const track = document.querySelector(".clients__track");
  const sequences = [...document.querySelectorAll(".clients__seq")];
  const announced = sequences.filter((s) => s.getAttribute("aria-hidden") !== "true");
  const clones = sequences.filter((s) => s.getAttribute("aria-hidden") === "true");

  if (!viewport || !track) {
    return { problems: ["marquee markup missing"], reduced };
  }

  // --- the six logos, announced exactly once -----------------------------
  const announcedImgs = announced.flatMap((s) => [...s.querySelectorAll("img")]);
  if (announcedImgs.length !== expected) {
    problems.push(`${announcedImgs.length} announced logos — expected ${expected}`);
  }
  if (announced.length !== 1) {
    problems.push(`${announced.length} announced sequences — expected 1`);
  }
  if (!announced[0]?.getAttribute("aria-label")) {
    problems.push("announced sequence has no aria-label");
  }
  for (const img of announcedImgs) {
    if (!img.alt.trim()) problems.push("announced logo without alt text");
  }

  // --- duplicates hidden from assistive tech -----------------------------
  if (!reduced && clones.length < 1) {
    problems.push("no duplicated sequence — the loop would gap");
  }
  for (const seq of clones) {
    if (seq.getAttribute("aria-hidden") !== "true") {
      problems.push("duplicated sequence is not aria-hidden");
    }
    for (const img of seq.querySelectorAll("img")) {
      if (img.alt !== "") problems.push(`duplicated logo carries alt "${img.alt}"`);
    }
  }

  // --- inert: no link, no pointer, no visible name -----------------------
  if (document.querySelectorAll(".clients a, .clients button, .clients [tabindex]").length) {
    problems.push("interactive element inside the clients section");
  }
  const slots = [...document.querySelectorAll(".clients__item")];
  for (const slot of slots) {
    if (getComputedStyle(slot).cursor === "pointer") problems.push("pointer cursor on a slot");
    if ((slot.textContent ?? "").trim()) problems.push("visible text inside a slot");
  }

  // --- proportions, containment, no card chrome --------------------------
  for (const img of document.querySelectorAll(".clients__item img")) {
    const r = img.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const intrinsic = img.naturalWidth / img.naturalHeight;
    const rendered = r.width / r.height;
    if (Math.abs(intrinsic - rendered) / intrinsic > 0.02) {
      problems.push(
        `distorted logo ${img.alt || "(clone)"}: ${round(rendered)} vs intrinsic ${round(intrinsic)}`,
      );
    }
    if (getComputedStyle(img).objectFit !== "contain") {
      problems.push(`object-fit is not contain — ${img.alt || "(clone)"}`);
    }
    const slot = img.closest(".clients__item").getBoundingClientRect();
    if (r.width > slot.width + 0.5 || r.height > slot.height + 0.5) {
      problems.push(`logo overflows its slot — ${img.alt || "(clone)"}`);
    }
  }
  for (const slot of slots) {
    const cs = getComputedStyle(slot);
    if (cs.boxShadow !== "none") problems.push("slot carries a shadow");
    if (parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderLeftWidth) > 0) {
      problems.push("slot carries a border — card chrome");
    }
  }

  // --- the edge fade -----------------------------------------------------
  const vpStyle = getComputedStyle(viewport);
  const mask = vpStyle.maskImage === "none" ? vpStyle.webkitMaskImage : vpStyle.maskImage;
  const hasFade = mask && mask !== "none" && /gradient/.test(mask);
  if (!reduced && !hasFade) problems.push("no edge fade on the marquee");
  if (!reduced && hasFade) {
    // a fade on one side only would leave the other edge looking cut
    const stops = (mask.match(/rgba?\([^)]*\)/g) ?? []).length;
    if (stops < 4) problems.push(`edge fade has ${stops} stops — needs both sides`);
  }

  // --- motion state ------------------------------------------------------
  const tStyle = getComputedStyle(track);
  const anim = track.getAnimations()[0];
  if (reduced) {
    if (tStyle.animationName !== "none" && anim && anim.playState === "running") {
      problems.push("animation still running under reduced motion");
    }
    const visibleClone = clones.some((c) => getComputedStyle(c).display !== "none");
    if (visibleClone) problems.push("duplicate still visible under reduced motion");
    const shown = announcedImgs.filter((i) => i.getBoundingClientRect().width > 0).length;
    if (shown !== expected) {
      problems.push(`reduced motion shows ${shown} logos — expected ${expected}`);
    }
  } else {
    if (tStyle.animationName === "none") problems.push("marquee is not animating");
    if (tStyle.animationTimingFunction !== "linear") {
      problems.push(`timing is ${tStyle.animationTimingFunction} — expected linear`);
    }
    if (tStyle.animationIterationCount !== "infinite") {
      problems.push("animation is not infinite");
    }
    if (vpStyle.overflow !== "hidden") problems.push(`viewport overflow is ${vpStyle.overflow}`);
  }

  // --- page must never scroll sideways -----------------------------------
  const overflow =
    document.documentElement.scrollWidth - document.documentElement.clientWidth;
  if (overflow > 0) problems.push(`horizontal page overflow ${overflow}px`);

  // --- carried over from earlier rounds ----------------------------------
  if (document.querySelector("#team, .team, .team__member")) {
    problems.push("team section is present");
  }
  for (const d of document.querySelectorAll(".display")) {
    const cs = getComputedStyle(d);
    const ratio = parseFloat(cs.lineHeight) / parseFloat(cs.fontSize);
    if (ratio < 1.22 || ratio > 1.32) {
      problems.push(`heading leading ${round(ratio)} outside 1.22–1.32`);
    }
  }

  return {
    problems,
    reduced,
    overflow,
    slots: slots.length,
    announcedCount: announcedImgs.length,
    alts: announcedImgs.map((i) => i.alt),
    duration: tStyle.animationDuration,
    fade: hasFade ? "both sides" : "none",
  };
};

const run = async (reduced) => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--hide-scrollbars", ...(reduced ? ["--force-prefers-reduced-motion"] : [])],
  });
  let bad = false;
  console.log(`\n=== ${reduced ? "prefers-reduced-motion: reduce" : "motion allowed"} ===`);
  try {
    for (const width of WIDTHS) {
      const page = await browser.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      page.on("requestfailed", (r) => errors.push(`request failed ${r.url()}`));

      await page.setViewport({ width, height: 900 });
      await page.goto(SITE, { waitUntil: "networkidle0" });
      await page.evaluate(async () => {
        document.querySelector(".clients")?.scrollIntoView({ block: "center" });
        const imgs = [...document.querySelectorAll(".clients__item img")];
        imgs.forEach((i) => { i.loading = "eager"; });
        await Promise.all(
          imgs.map((i) => (i.complete ? i.decode().catch(() => {}) : new Promise((r) => { i.onload = r; i.onerror = r; }))),
        );
        await document.fonts.ready;
      });
      await new Promise((r) => setTimeout(r, 600));

      const result = await page.evaluate(audit, EXPECTED_LOGOS);
      const fail = result.problems.length > 0 || errors.length > 0;
      if (fail) bad = true;

      console.log(
        `${fail ? "FAIL" : "OK  "} ${String(width).padStart(4)}px  ` +
          `slots ${result.slots}  announced ${result.announcedCount}/${EXPECTED_LOGOS}  ` +
          `overflow ${result.overflow}px  duration ${result.duration}  fade ${result.fade}  ` +
          `console ${errors.length}`,
      );
      for (const p of result.problems) console.log(`       ! ${p}`);
      for (const e of errors.slice(0, 3)) console.log(`       ! console: ${e}`);
      if (width === WIDTHS[0]) console.log(`       logos: ${result.alts.join(" · ")}`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
  return bad;
};

const failedMotion = await run(false);
const failedReduced = await run(true);

const failed = failedMotion || failedReduced;
console.log(failed ? "\nFAIL marquee QA." : "\nPASS marquee QA.");
process.exit(failed ? 1 : 0);
