/**
 * Selected work — the proof chapter.
 *
 * PUBLICATION IS GATED IN CODE, NOT BY CONVENTION.
 *
 * Every study carries a `publication` state and the source of the right that
 * grants it. Only `approved` studies are exported to the page, and a study's
 * media is only ever reachable through that filter — so a study whose rights
 * are still pending cannot be rendered, cannot be linked, and its files are not
 * referenced by any module the bundler can follow.
 *
 * Two different kinds of right appear here and they are not interchangeable:
 *
 *   contract  — a signed clause naming this use. Obaid Abid's service agreement
 *               (SGH-أ-202608-001, 2026-08-24) clause 18 «عرض المشروع ضمن أعمال
 *               صَوْغ» grants display of the project name and images of the site
 *               on SOGH's own website after public launch, excluding
 *               confidential data.
 *   owner     — the owner's own confirmation, recorded 2026-09-14, that SOGH may
 *               publish this work. For Acadify this deliberately supersedes
 *               decision D-19 in the knowledge base, which had blocked it
 *               pending a usage right.
 *
 * NOTHING HERE IS A RESULT. No revenue, traffic, conversion, ranking, student
 * or application figure appears in this file, because none is documented
 * anywhere in the repository. Every description states only what SOGH built or
 * ran, drawn from the signed scope of work or from the delivered artefacts.
 */

export type WorkMedia = {
  /** the image; when `video` is set this is also the video's poster frame */
  readonly src: string;
  /** narrower source for the srcset; omit when the original is already small */
  readonly src900?: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
  /** when present this slot is a video, played only on the visitor's request */
  readonly video?: string;
  /** accessible name for that video */
  readonly videoLabel?: string;
};

/** a factual delivery record, used where no publishable visual exists */
export type WorkRecord = {
  readonly label: string;
};

/**
 * A figure taken verbatim from a client performance report.
 *
 * `value` and `label` are never reworded into something stronger than the
 * source says. A WhatsApp visit is a visit; it is not a lead, a booking, a
 * conversation or a customer, and the report that produced these numbers
 * explicitly leaves actual conversations and bookings still to be tracked.
 */
export type WorkMetric = {
  readonly value: string;
  readonly label: string;
};

export type CaseStudy = {
  readonly id: string;
  readonly index: string;
  /** the project's own name, as the client writes it */
  readonly name: string;
  /** true when the name is Latin and needs an isolated LTR run inside RTL */
  readonly latinName: boolean;
  /** the Arabic positioning line */
  readonly statement: string;
  /** what SOGH actually built or ran — scope, never outcome */
  readonly description: string;
  readonly capabilities: readonly string[];
  /** only a destination that exists and resolves to the real project */
  readonly href?: string;
  readonly media: readonly WorkMedia[];
  /**
   * How the media is composed. `single` is one capture beside the copy;
   * `mosaic` is a dominant visual over a supporting grid; `dossier` runs a
   * tall portrait column of produced content beside a copy spine carrying the
   * delivery record and the campaign figures. Defaults to single.
   */
  readonly layout?: "single" | "mosaic" | "dossier";
  /** shown instead of media when no publishable visual exists */
  readonly record?: readonly WorkRecord[];
  /** verified campaign figures, quoted from a client report — never estimated */
  readonly metrics?: readonly WorkMetric[];
  /** the sentence that keeps those figures in their real context */
  readonly metricsNote?: string;
  readonly publication: "approved" | "pending";
  /** what grants the right — read by qa:work, never rendered */
  readonly rightSource: string;
};

const STUDIES: readonly CaseStudy[] = [
  {
    id: "acadify",
    index: "01",
    name: "Acadify",
    latinName: true,
    statement: "من فكرة تعليمية إلى منصة رقمية متكاملة.",
    description:
      "عملنا مع أكاديفاي على بناء حضورها الرقمي من الأساس، بدءًا من تطوير المنصة والموقع وتجهيز النطاق والبريد الرسمي، وصولًا إلى تفعيل قنوات التواصل الاجتماعي وبناء حضور رقمي يدعم التشغيل والتسويق والخدمات التعليمية.",
    /*
     * The infrastructure work stays prose and capability only: the domain and
     * the official mail exist as facts of the engagement, never as records,
     * registrar detail or credentials.
     */
    capabilities: [
      "استراتيجية رقمية",
      "المنصة والموقع",
      "بنية رقمية",
      "قنوات التواصل",
      "محتوى",
      "تشغيل تسويقي",
    ],
    href: "https://acadifysa.com",
    media: [
      {
        src: "/work/acadify-platform.webp",
        src900: "/work/acadify-platform-900.webp",
        width: 1600,
        height: 1000,
        alt: "الصفحة الرئيسية لمنصة أكاديفاي",
      },
    ],
    publication: "approved",
    rightSource:
      "owner 2026-09-14 (supersedes D-19); scope confirmed by the owner 2026-09-17",
  },
  {
    id: "obaid-abid",
    index: "02",
    name: "Obaid Abid",
    latinName: true,
    statement: "حضور رقمي احترافي يعكس الثقة",
    description:
      "صمّمنا وطوّرنا الصفحة الرسمية للمكتب: هيكلة المحتوى ورحلة الزائر، وواجهة مخصصة، وتصميم متجاوب، وتحسين الأداء، ونموذج تواصل — حتى الربط والنشر.",
    capabilities: ["تطوير", "تجربة استخدام", "واجهة أمامية", "أداء"],
    href: "https://www.oabid.com.sa/",
    media: [
      {
        src: "/work/oabid-landing.webp",
        src900: "/work/oabid-landing-900.webp",
        width: 1600,
        height: 1000,
        alt: "الصفحة الرسمية لمكتب عبيد عابد محاسبون ومراجعون قانونيون",
      },
    ],
    publication: "approved",
    rightSource: "contract SGH-أ-202608-001 clause 18, signed 2026-08-24",
  },
  {
    id: "dar-ward",
    index: "03",
    name: "دار ورد",
    latinName: false,
    statement: "من خدمة منزلية إلى منظومة تسويق وحجز متكاملة.",
    description:
      "عملنا مع دار ورد على بناء حضور رقمي وتشغيلي متكامل يجمع بين تخطيط المحتوى، الإنتاج الإبداعي، إدارة الحملات الإعلانية، وتنظيم رحلة الحجز عبر واتساب. الهدف لم يكن صناعة محتوى منفصل، بل بناء منظومة تربط المحتوى بالإعلان والتواصل والحجز.",
    capabilities: [
      "استراتيجية رقمية",
      "استراتيجية محتوى",
      "إنتاج إبداعي",
      "فيديو قصير",
      "إعلانات مدفوعة",
      "تشغيل تسويقي",
    ],
    /*
     * No link. darwardspa.com still resolves to an unconfigured hosting
     * placeholder — checked again on 2026-09-16 — so linking it would send a
     * visitor to a parking page.
     */
    layout: "dossier",
    /*
     * Produced content, in the order that makes the engagement legible:
     * the campaign that was conceived and staged, then the art direction, then
     * the people. One video ships — the campaign — because it is the piece
     * whose meaning depends on motion. The other two are real frames from the
     * delivered footage, which is enough to show what was made and costs a
     * fraction of the bytes.
     */
    media: [
      {
        src: "/work/darward-campaign-poster.webp",
        width: 720,
        height: 1280,
        alt: "لقطة من حملة «خبر عاجل» لدار ورد — مطبوعات موزّعة في مواقع حقيقية",
        video: "/work/darward-campaign.mp4",
        videoLabel: "فيديو حملة «خبر عاجل» من دار ورد",
      },
      {
        src: "/work/darward-artdirection.webp",
        width: 560,
        height: 996,
        alt: "إطار من محتوى دار ورد — تكوين بصري بقفازات سوداء على خلفية فاتحة",
      },
      {
        src: "/work/darward-human.webp",
        width: 560,
        height: 996,
        alt: "إطار من محتوى دار ورد المصوَّر داخل مقر العمل",
      },
    ],
    /*
     * The record is the operating spine beside the produced work: what the
     * engagement ran, not what it looked like. The August content plan stays
     * out of it as OUTPUT — every row is marked «بانتظار الاعتماد» and «لم
     * يبدأ», so it evidences planning only, and it carries staff names,
     * unapproved pricing and a pending offer that must never reach a public
     * page. The videos now carry the execution evidence instead.
     */
    record: [
      { label: "استراتيجية ومنظومة محتوى شهرية" },
      { label: "خطة نشر عبر إنستقرام وتيك توك وسناب" },
      { label: "مقالات تحسين ظهور بالإنجليزية" },
      { label: "حملات واتساب مدفوعة" },
      { label: "تقارير أداء دورية" },
    ],
    /*
     * Quoted from «التقرير التنفيذي لأداء حملة دار ورد» (data through
     * 2026-07-18). Three of the report's figures, unrounded except 6,704 ->
     * 6.7K. Spend and CPM are left out: the section is not an Ads Manager
     * dashboard, and spend only means something next to the cost-per-visit,
     * which the note below carries.
     */
    metrics: [
      { value: "403", label: "زيارة واتساب" },
      { value: "0.22 ر.س", label: "تكلفة الزيارة" },
      { value: "6.7K", label: "وصول" },
    ],
    metricsNote:
      "حققت إحدى حملات واتساب 403 زيارات بإجمالي إنفاق 87.12 ر.س، بمتوسط يقارب 0.22 ر.س للزيارة.",
    publication: "approved",
    rightSource:
      "owner 2026-09-14; media supplied 2026-09-16; figures from the client campaign report",
  },
  {
    id: "mutas",
    index: "04",
    name: "Mutas",
    latinName: true,
    statement: "من خطة محتوى إلى حملات تعيش مع الجمهور.",
    description:
      "عملنا مع موتاس على بناء وتنفيذ منظومة محتوى متكاملة تجمع بين التخطيط، الإنتاج الإبداعي، الفيديو، الحملات الإعلانية والتفعيلات الموسمية. من إطلاق منتجات مثل V60 حبحب، إلى يوم التأسيس وعروض رمضان، وصولًا إلى التعاون مع صناع المحتوى وتوسيع حضور العلامة عبر المحتوى المدفوع والعضوي.",
    capabilities: [
      "استراتيجية محتوى",
      "إبداع",
      "إنتاج فيديو",
      "صناع المحتوى",
      "إعلانات مدفوعة",
      "حملات وتفعيلات",
    ],
    /*
     * Five pieces, each proving a different part of the engagement, so the
     * mosaic reads as one campaign system rather than a feed: the audience the
     * work is for, a product launch, a creator collaboration, an on-ground
     * activation, and a seasonal offer. Nothing here is a social gallery —
     * every slot answers "and we also did THIS".
     */
    layout: "mosaic",
    media: [
      {
        src: "/work/mutas-guests.webp",
        src900: "/work/mutas-guests-760.webp",
        width: 1280,
        height: 1707,
        alt: "ضيوف داخل مقهى موتاس يحملون مشروبات من الحملة",
      },
      {
        src: "/work/mutas-v60-launch.webp",
        width: 700,
        height: 875,
        alt: "إعلان إطلاق مشروب V60 حبحب",
      },
      {
        /*
         * The creator video. `preload="none"` plus a poster pulled from the
         * footage itself means nothing downloads until someone presses play —
         * the 1.4MB never lands on a page load. It is the only asset that can
         * prove a creator collaboration; a still cannot.
         */
        src: "/work/mutas-creator-poster.webp",
        width: 720,
        height: 1280,
        alt: "محتوى من تعاون مع صانع محتوى داخل مقهى موتاس",
        video: "/work/mutas-creator.mp4",
        videoLabel: "فيديو من حملة صناع المحتوى",
      },
      {
        src: "/work/mutas-activation.webp",
        width: 720,
        height: 1280,
        alt: "تفعيل يوم التأسيس داخل فرع موتاس",
      },
      {
        src: "/work/mutas-offer.webp",
        width: 700,
        height: 1244,
        alt: "إعلان عرض موسمي من موتاس",
      },
    ],
    publication: "approved",
    rightSource: "owner 2026-09-15 (campaign material supplied for this case study)",
  }
];

/** the only export the page may render */
export const CASE_STUDIES: readonly CaseStudy[] = STUDIES.filter(
  (study) => study.publication === "approved",
);

/** held back — exported for the release gate to assert nothing of theirs ships */
export const PENDING_STUDIES: readonly CaseStudy[] = STUDIES.filter(
  (study) => study.publication !== "approved",
);

export const HAS_CASE_STUDIES = CASE_STUDIES.length > 0;
