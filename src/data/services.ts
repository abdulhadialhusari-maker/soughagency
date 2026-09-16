/**
 * The five service groups. Each group states the business outcome it produces,
 * not the list of platforms it touches.
 */

export type ServiceGlyph =
  | "trajectory"
  | "reach"
  | "compose"
  | "frame"
  | "network";

export type ServiceGroup = {
  readonly id: string;
  readonly number: string;
  readonly title: string;
  readonly outcome: string;
  readonly glyph: ServiceGlyph;
  readonly items: readonly string[];
};

export const SERVICE_GROUPS: readonly ServiceGroup[] = [
  {
    id: "strategy",
    number: "01",
    title: "الاستراتيجية والنمو",
    outcome: "قرارات أوضح ومسار نمو مكتوب بدل الاجتهاد الشهري.",
    glyph: "trajectory",
    items: [
      "الاستراتيجية التسويقية",
      "دراسة السوق والجمهور",
      "بناء رحلة العميل",
      "خطط النمو والدخول إلى السوق",
    ],
  },
  {
    id: "performance",
    number: "02",
    title: "التسويق والأداء",
    outcome: "إنفاق إعلاني يُقاس بالعائد، لا بعدد المشاهدات.",
    glyph: "reach",
    items: [
      "الحملات الإعلانية",
      "التسويق عبر محركات البحث",
      "التسويق عبر منصات التواصل",
      "التحليل والتحسين المستمر",
    ],
  },
  {
    id: "content",
    number: "03",
    title: "المحتوى والإبداع",
    outcome: "حضور متماسك يبني الطلب بدل أن يلاحق الترند.",
    glyph: "compose",
    items: [
      "استراتيجية المحتوى",
      "الحملات الإبداعية",
      "صناعة المحتوى",
      "التصميم والإنتاج",
    ],
  },
  {
    id: "brand",
    number: "04",
    title: "الهوية والتجربة الرقمية",
    outcome: "علامة تُفهم من أول نظرة، وتجربة تُنهي الزيارة بإجراء.",
    glyph: "frame",
    items: [
      "بناء وتطوير الهوية",
      "تصميم تجربة المستخدم",
      "تصميم وتطوير المواقع",
      "صفحات الهبوط والتحويل",
    ],
  },
  {
    id: "ai",
    number: "05",
    title: "الذكاء الاصطناعي والأتمتة",
    outcome: "وقت فريقك يعود إلى ما يصنع القيمة فعلًا.",
    glyph: "network",
    items: [
      "حلول الذكاء الاصطناعي للأعمال",
      "أتمتة العمليات التسويقية",
      "أنظمة إدارة العملاء والعملاء المحتملين",
      "مساعدين ووكلاء ذكاء اصطناعي مخصصين",
    ],
  },
];

/** Options for the «الخدمة المطلوبة» field, derived from the same source. */
export const SERVICE_OPTIONS: readonly string[] = SERVICE_GROUPS.map(
  (group) => group.title,
);
