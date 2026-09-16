/**
 * Client logos.
 *
 * RULES (enforced by the Clients component and by the release gate, not just
 * by convention):
 * - the strip renders the logo and nothing else — no name, no sector, no
 *   result, no testimonial, no card, no link, no hover affordance;
 * - `alt` exists for assistive technology only and is never shown visually;
 * - an entry whose `src` is null is not rendered at all. A missing official
 *   logo is left missing on purpose — never a placeholder, a redrawn mark, or
 *   a text substitute.
 *
 * `box` is the share of the cell's content area each logo may occupy, as a
 * percentage — width and height budgeted separately. Only one of the two ever
 * binds: a wide wordmark runs out of width first, a stacked lockup or a round
 * badge runs out of height first, and the other value is left generous.
 *
 * The numbers are solved against RENDERED AREA, not width. Equal widths make a
 * 4.7:1 wordmark look small beside a square mark, and equal heights do the
 * reverse; area is what the eye actually weighs. The two solid-plate marks sit
 * a little under the target because a filled tile reads heavier than an open
 * wordmark of the same size. The image keeps its own aspect ratio; nothing is
 * stretched, cropped, or redrawn.
 *
 * `plate: true` marks a logo whose background is part of the artwork — gold on
 * navy, white script on pale blue. Those backgrounds are NOT knocked out,
 * because removing them would erase the logo. They keep a small radius so the
 * tile reads as the supplied artwork rather than a crop.
 *
 * Every file is the client's own official artwork, trimmed and rescaled only.
 */

export type ClientLogo = {
  readonly id: string;
  /** public path, or null while no official artwork of usable quality exists */
  readonly src: string | null;
  readonly alt: string;
  /** share of the cell this logo may occupy, in percent */
  readonly box: { readonly w: number; readonly h: number };
  /** true when the artwork carries its own background */
  readonly plate?: boolean;
  readonly width: number;
  readonly height: number;
};

export const CLIENT_LOGOS: readonly ClientLogo[] = [
  {
    id: "obaid-abid",
    src: "/clients/obaid-abid.webp",
    alt: "عبيد عابد",
    box: { w: 79, h: 60 },
    width: 626,
    height: 132,
  },
  {
    id: "acadify",
    src: "/clients/acadify.webp",
    alt: "أكاديفاي",
    box: { w: 70, h: 72 },
    width: 226,
    height: 244,
  },
  {
    id: "dar-ward",
    src: "/clients/dar-ward.webp",
    alt: "دار ورد",
    box: { w: 70, h: 66 },
    width: 240,
    height: 241,
  },
  {
    id: "bint-albalad",
    src: "/clients/bint-albalad.webp",
    alt: "بنت البلد",
    box: { w: 73, h: 60 },
    width: 446,
    height: 111,
  },
  {
    id: "mutas-cafe",
    src: "/clients/mutas-cafe.webp",
    alt: "موتاس كافيه",
    box: { w: 70, h: 55 },
    plate: true,
    width: 420,
    height: 310,
  },
  {
    id: "binyan-alfakhama",
    src: "/clients/binyan-alfakhama.webp",
    alt: "بنيان الفخامة للتمليك",
    box: { w: 70, h: 69 },
    plate: true,
    width: 333,
    height: 390,
  },
];

export const AVAILABLE_CLIENT_LOGOS = CLIENT_LOGOS.filter(
  (logo): logo is ClientLogo & { src: string } => Boolean(logo.src),
);
