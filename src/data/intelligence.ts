/**
 * Where AI actually sits inside the work. Deliberately describes practice, not
 * a product: SOGH does not own or sell a platform, so none is claimed.
 */

export type IntelligenceUse = {
  readonly number: string;
  readonly title: string;
  readonly copy: string;
};

export const INTELLIGENCE_USES: readonly IntelligenceUse[] = [
  {
    number: "01",
    title: "البحث والتحليل",
    copy: "قراءة السوق والمنافسين وسلوك الجمهور في وقت أقصر.",
  },
  {
    number: "02",
    title: "تطوير الأفكار",
    copy: "توليد زوايا إبداعية أكثر، ثم اختيارها بمعايير واضحة.",
  },
  {
    number: "03",
    title: "تسريع الإنتاج",
    copy: "نسخ ومسودات وبدائل تصل أسرع إلى مرحلة المراجعة.",
  },
  {
    number: "04",
    title: "أتمتة العمليات",
    copy: "سير عمل يربط الطلب بالتنفيذ بالتسليم دون خطوات يدوية مكررة.",
  },
  {
    number: "05",
    title: "تحليل الأداء",
    copy: "قراءة أرقام الحملات وتحويلها إلى قرار تحسين محدد.",
  },
  {
    number: "06",
    title: "تحسين تجربة العميل",
    copy: "ردود أسرع ومتابعة أدق عبر قنوات التواصل والمبيعات.",
  },
];

export const INTELLIGENCE_NOTE =
  "القرار والاستراتيجية والمسؤولية تبقى بشرية. الذكاء الاصطناعي أداة داخل المنظومة، وليست بديلًا عن الحِرفة.";
