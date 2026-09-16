/** منهج صَوْغ — four stages, presented as one connected run, not four cards. */

export type MethodStage = {
  readonly number: string;
  readonly title: string;
  readonly copy: string;
  /** short label placed on the rail under the node */
  readonly marker: string;
};

export const METHOD: readonly MethodStage[] = [
  {
    number: "01",
    title: "نفهم",
    copy: "نفهم النشاط والسوق والجمهور والتحدي الحقيقي قبل اقتراح أي مخرج.",
    marker: "المعطيات",
  },
  {
    number: "02",
    title: "نصوغ",
    copy: "نحوّل المعطيات إلى استراتيجية ورسالة وتجربة واضحة.",
    marker: "الاتجاه",
  },
  {
    number: "03",
    title: "ننفذ",
    copy: "نطلق المحتوى والحملات والتجارب الرقمية بجودة عالية.",
    marker: "الإطلاق",
  },
  {
    number: "04",
    title: "ننمّي",
    copy: "نقيس النتائج، نتعلم، نحسّن، ثم نوسّع ما ينجح.",
    marker: "التوسّع",
  },
];
