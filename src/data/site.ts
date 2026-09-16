/**
 * Site-level constants: canonical origin, navigation, and the copy that appears
 * in more than one place. Nothing here is invented — the origin was verified to
 * resolve and serve this site before it was written down.
 */

/** Canonical origin. No trailing slash. */
export const SITE_URL = "https://soghagency.com";

export const SITE_NAME = "صَوْغ | SOGH";
export const SITE_NAME_EN = "SOGH";
export const LEGAL_ENTITY_AR = "مؤسسة فلك المسار الريادي";
export const FOUNDED_YEAR = "2025";

export const SEO = {
  title: "صَوْغ | SOGH — وكالة تسويق ونمو سعودية",
  description:
    "صَوْغ وكالة تسويق ونمو سعودية تجمع الاستراتيجية والإبداع والأداء والذكاء الاصطناعي في منظومة واحدة، لتحويل الأفكار إلى نمو قابل للقياس.",
  ogTitle: "صَوْغ | SOGH — نصوغ الأفكار إلى نمو قابل للقياس",
  ogDescription:
    "استراتيجية ونمو، تسويق وأداء، محتوى وإبداع، هوية وتجربة رقمية، وذكاء اصطناعي وأتمتة — تحت رؤية واحدة.",
  ogImage: "/sogh-og-1200x630.png",
} as const;

export type NavItem = {
  readonly id: string;
  readonly label: string;
};

/**
 * The Arabic menu only. An English menu is not listed here because no complete
 * English version of this site exists yet.
 * «أعمالنا» is added automatically by the header when — and only when — a
 * documented case study exists (see data/work.ts).
 */
export const NAV: readonly NavItem[] = [
  { id: "home", label: "الرئيسية" },
  { id: "services", label: "خدماتنا" },
  { id: "method", label: "منهجنا" },
  { id: "about", label: "من نحن" },
  { id: "contact", label: "تواصل معنا" },
];

export const PRIMARY_CTA = { id: "contact", label: "ابدأ مشروعك" } as const;
