# Legacy QA scripts — v1.0 markup

These four scripts locked down invariants of the **v1.0** hero and typography
system: the blue Hero word, the `.hero-title__punctuation` size ratio, the
`.display-title` line boxes, and the v1.0 motion sequence.

The v2.0 redesign (2026-09-09) replaced that markup, so every selector these
scripts query is gone and each one throws on the current site. They are kept
here for the record, not for use.

The current gates that supersede them:

- `npm run qa:shots` — full-page captures across the release width matrix, with
  horizontal-overflow and console-error checks, under reduced motion by default
  (`QA_MOTION=1` to capture with motion on).
- `npm run qa:release` — the release gate: responsive matrix, CTA above the
  fold, skip link, mobile menu, form validation and the composed mail, the
  accessibility floor, launch metadata, structured data, the client-logo content
  rules, and the reduced-motion final states.
