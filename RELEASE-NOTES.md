# SOGH Public Website v1.0 r2 — Release Notes

Date: 2026-07-18  
Scope: final local production handoff; no deployment

## Fixed

- Removed the global `body` minimum width that caused `15px` horizontal
  overflow when a Windows classic scrollbar reduced a `320px` window to a
  `305px` document client width.
- Replaced the symptom-masking horizontal clip with a naturally fitting root
  layout (`html`, `body`, `#root`: `width: 100%`, `min-width: 0`,
  `max-width: 100%`).
- Added shrink-safe sizing to display headings and single-column responsive
  grids.
- Added responsive maximum sizing for image, SVG, video, and canvas media
  without forcing their width.
- Added narrowly scoped diagnostic font clamps below `340px` for Method and
  below `300px` for the AI title. Supported widths and desktop appearance are
  unchanged.

## QA tooling

- Added `npm run qa:release`, covering the complete responsive matrix,
  visible-edge detection, font and zoom state, Hero invariants, keyboard focus,
  mobile navigation, form validation/email preparation, accessibility
  structure, allowed links, metadata, and console errors.
- Updated the typography QA to treat the approved desktop Work heading as one
  visual line while retaining explicit semantic spans.

## Preserved exactly

Approved identity, Arabic copy, Alexandria typography, Hero composition,
Hero punctuation ratio, Hero/AI motion sequence, contacts, navigation, section
order, form behavior, and all other signal lines remain unchanged.

## Production output

- JavaScript: `assets/index-CsqcPn68.js`
- CSS: `assets/index-FJ0w4iAL.css`
- Status: TypeScript and Vite build passed; zero audit vulnerabilities.
- Deployment: not performed.
