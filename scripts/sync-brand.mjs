/**
 * Syncs approved brand assets + contact config from the canonical SOGH repo
 * into this website, keeping the site portable (it ships its own copies).
 *
 *   npm run sync:brand
 *
 * Source of truth: C:\Users\HP\sogh-brand (override with SOGH_BRAND_DIR).
 * Never edit the synced files here — change them in the canonical repo and
 * re-run the sync.
 */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const site = join(dirname(fileURLToPath(import.meta.url)), "..");
const brand = process.env.SOGH_BRAND_DIR ?? "C:\\Users\\HP\\sogh-brand";

if (!existsSync(brand)) {
  console.error(`canonical brand repo not found: ${brand}`);
  process.exit(1);
}

/** [source relative to canonical repo, destination relative to this site] */
const FILES = [
  // contact config — single source of truth for public contacts
  ["brand/contact.json", "brand/contact.json"],
  // SVG logo masters used by the site
  ["public/exports/logo/svg/sogh-logo-ar-primary.svg", "public/brand/sogh-logo-ar-primary.svg"],
  ["public/exports/logo/svg/sogh-logo-en-primary.svg", "public/brand/sogh-logo-en-primary.svg"],
  ["public/exports/logo/svg/sogh-lockup-bilingual-horizontal.svg", "public/brand/sogh-lockup-bilingual-horizontal.svg"],
  ["public/exports/logo/svg/sogh-lockup-bilingual-horizontal-white.svg", "public/brand/sogh-lockup-bilingual-horizontal-white.svg"],
  ["public/exports/logo/svg/sogh-mark-unit.svg", "public/brand/sogh-mark-unit.svg"],
  ["public/exports/logo/svg/sogh-mark-unit-white.svg", "public/brand/sogh-mark-unit-white.svg"],
  ["public/exports/logo/svg/sogh-mark-signal.svg", "public/brand/sogh-mark-signal.svg"],
  ["public/exports/logo/svg/sogh-mark-signal-white.svg", "public/brand/sogh-mark-signal-white.svg"],
  // favicons + OG image from the approved export package
  ["public/favicon.svg", "public/favicon.svg"],
  ["public/exports/web/favicon-32.png", "public/favicon-32.png"],
  ["public/exports/web/favicon-180.png", "public/apple-touch-icon.png"],
  ["public/exports/web/sogh-og-1200x630.png", "public/sogh-og-1200x630.png"],
];

let copied = 0;
const missing = [];
for (const [srcRel, dstRel] of FILES) {
  const src = join(brand, srcRel);
  if (!existsSync(src)) {
    missing.push(srcRel);
    continue;
  }
  const dst = join(site, dstRel);
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(src, dst);
  copied++;
  console.log("✓", dstRel);
}

console.log(`synced ${copied}/${FILES.length} files from ${brand}`);
if (missing.length) {
  console.error("missing in canonical repo:", missing.join(", "));
  process.exit(1);
}
