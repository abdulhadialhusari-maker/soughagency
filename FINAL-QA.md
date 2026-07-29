# SOGH Public Website v1.0 r2 — Final QA

Date: 2026-07-18  
Verdict: **PASS — local production handoff; not deployed**

## Closed blocker

At a Windows Chrome window of `320×700`, the classic scrollbar reduces the
visible document width to `305px`. The former `body` rule enforced
`min-width: 320px` and masked the resulting overflow with `overflow-x: clip`.
This forced `body`, `#root`, the page sections, and `.public-footer` beyond the
visible document edge.

The final CSS removes the fixed body minimum and the overflow mask, constrains
`html`, `body`, and `#root` to the natural document width, allows layout items
to shrink, and keeps media intrinsically responsive. No approved visual,
content, typography, Hero, motion, contact, or section-structure decision was
changed.

## Windows classic-scrollbar measurement

| Item | Final value |
| --- | ---: |
| Window viewport | `320×700` |
| `documentElement.clientWidth` | `305px` |
| `documentElement.scrollWidth` | `305px` |
| Horizontal overflow | `0px` |
| Method heading bounds | `15px → 290px` (`275px`) |
| Method second line bounds | `28.125px → 290px` (`261.875px`) |
| Footer bounds | `0px → 305px` (`305px`) |
| Edge offenders | `0` |

## Responsive and visual QA

Production preview was checked at `280×700`, `300×700`, `305×700`,
`320×700`, `360×800`, `375×812`, `390×844`, `430×932`, `560×800`,
`768×900`, `1024×768`, `1280×800`, `1338×628`, and `1440×900`.
Every viewport returned `scrollWidth === clientWidth`, zero edge offenders,
loaded fonts, no broken image, and 100% browser zoom. Method, footer, form, and
sticky header remained inside the visible edge.

The full-page `320×700`, `375×812`, and `1338×628` previews plus the Method and
Footer `320×700` close-ups were opened and inspected. Arabic glyphs, dots, and
diacritics are not clipped. The Hero underline remains absent and the Hero
punctuation remains at the approved `60%` size.

## Regression QA

- Build: `npm run build` passed (`tsc --noEmit` + Vite, 30 modules).
- Output: `index-CsqcPn68.js` (`163.57 kB`) and
  `index-FJ0w4iAL.css` (`22.28 kB`) before gzip.
- Dependencies: `npm audit` reported zero vulnerabilities.
- Typography: full suite and pass 3 passed; no collision, clipping, horizontal
  overflow, or font-load layout shift beyond the documented negligible CLS.
- Motion: Hero runs once; AI starts once on viewport entry and does not replay.
  Reduced motion renders the same complete final state immediately.
- Console: zero errors and zero page errors.
- Mobile navigation: opens, closes on Escape, closes after an anchor selection,
  and hides links from focus when closed.
- Form: required name, telephone, service, and brief validation passed. A
  generic test prepares a structured email to `soghagency@gmail.com` containing
  every field while preserving entered data. No backend or browser storage is
  used.
- Accessibility: Arabic language and RTL direction, one H1, no heading-level
  skips, explicit labels and required states, named controls/SVGs, keyboard skip
  link, visible focus, and WCAG AA color contrast passed.
- Public contacts: telephone, email, Instagram, TikTok, and Snapchat only.
- Metadata: Arabic title/description, working favicon and OG image,
  `noindex, nofollow`, no canonical domain, and no `og:url`.
- Content scan: no WhatsApp, X, LinkedIn, Adam Mohammed, internal Sales Kit,
  brand-hub navigation, fake domain, environment file, or secret in `dist`.

## Evidence

- `03-qa-evidence/release-qa-report.json`
- `03-qa-evidence/contrast-report.json`
- `03-qa-evidence/windows-classic-320-metrics.json`
- `03-qa-evidence/full-page-320x700.png`
- `03-qa-evidence/method-320x700.png`
- `03-qa-evidence/footer-320x700.png`
- `03-qa-evidence/full-page-375x812.png`
- `03-qa-evidence/full-page-1338x628.png`
- `03-qa-evidence/hero-motion.webm`
- `03-qa-evidence/reduced-hero.png`
- `03-qa-evidence/reduced-ai.png`

No Vercel or other deployment action was performed.
