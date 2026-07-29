import { FormEvent, useEffect, useState } from "react";
import { contact, emailHref, phoneHref, socialLinks } from "./contact";
import { ArabicWordmark, SignalMark, useInViewOnce, useMotionAllowed } from "./motion";

const NAVIGATION = [
  ["home", "الرئيسية"],
  ["services", "خدماتنا"],
  ["method", "كيف نعمل"],
  ["work", "نماذج العمل"],
  ["about", "عن صَوْغ"],
  ["start", "ابدأ مشروعك"],
] as const;

const SERVICES = [
  {
    number: "01",
    title: "الاستراتيجية والهوية",
    copy: "بحث وتمركز ورسائل وهوية بصرية ودليل استخدام يجعل قرارات العلامة أوضح وأكثر اتساقًا.",
  },
  {
    number: "02",
    title: "المحتوى والإبداع",
    copy: "استراتيجية محتوى وكتابة وتصميم وفيديو قصير وحملات مبنية كنظام، لا كمنشورات منفصلة.",
  },
  {
    number: "03",
    title: "التجربة الرقمية",
    copy: "مواقع وصفحات هبوط وواجهات تربط حضور العلامة برسالة واضحة ومسار تحويل مفهوم.",
  },
  {
    number: "04",
    title: "الذكاء والأتمتة",
    copy: "سير عمل وأتمتة ومساعدات داخلية تقلل التكرار، مع مراجعة بشرية وضوابط واضحة.",
  },
  {
    number: "05",
    title: "النمو والحملات",
    copy: "تخطيط حملات وقياس وتجارب تحسين تربط التنفيذ بهدف تجاري ومؤشر يمكن مراجعته.",
  },
] as const;

const METHOD = [
  ["01", "نفهم", "نكتشف النشاط والجمهور والتحدي والهدف قبل اقتراح أي مخرج."],
  ["02", "نصوغ", "نحوّل المعطيات إلى تمركز ورسالة ونطاق عمل واضح."],
  ["03", "نبني", "ننفذ الهوية والمحتوى والتجربة ضمن نظام متماسك."],
  ["04", "نقيس", "نراجع المؤشرات والتغذية الراجعة ونحسّن ما يضيف قيمة."],
] as const;

const WORK_PATHS = [
  {
    eyebrow: "مسار توضيحي / تأسيس",
    title: "من فكرة أولية إلى نظام علامة قابل للتطبيق.",
    copy: "مسار يوضح كيف يمكن ربط التمركز والرسائل والهوية والمحتوى الأولي ضمن أساس واحد متماسك.",
    tags: ["استراتيجية", "هوية", "نظام محتوى"],
    tone: "light",
  },
  {
    eyebrow: "مسار توضيحي / تشغيل",
    title: "من عمليات متفرقة إلى سير عمل أوضح.",
    copy: "مسار يوضح تنظيم إنتاج المحتوى والاعتمادات والأتمتة تحت مراجعة بشرية ومسؤوليات محددة.",
    tags: ["محتوى", "أتمتة", "قياس"],
    tone: "dark",
  },
] as const;

type RequiredFormField = "name" | "phone" | "service" | "brief";
type FormErrors = Partial<Record<RequiredFormField, string>>;

const REQUIRED_FORM_MESSAGES: Record<RequiredFormField, string> = {
  name: "يرجى كتابة الاسم.",
  phone: "يرجى كتابة رقم الهاتف.",
  service: "يرجى اختيار الخدمة المطلوبة.",
  brief: "يرجى كتابة نبذة مختصرة عن المشروع.",
};

function prepareEmail(form: HTMLFormElement) {
  const data = new FormData(form);
  const value = (key: string) => String(data.get(key) ?? "").trim();
  const subject = `طلب مشروع جديد — ${value("company") || value("name")}`;
  const body = [
    "مرحبًا فريق صَوْغ،",
    "",
    `الاسم: ${value("name")}`,
    `الشركة أو المشروع: ${value("company") || "غير محدد"}`,
    `الهاتف: ${value("phone") || "غير محدد"}`,
    `الخدمة المطلوبة: ${value("service")}`,
    "",
    "نبذة المشروع:",
    value("brief"),
  ].join("\n");

  return `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [preparedEmail, setPreparedEmail] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const motionAllowed = useMotionAllowed();
  const aiBand = useInViewOnce<HTMLElement>(motionAllowed);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const clearFieldError = (field?: RequiredFormField) => {
    setPreparedEmail("");
    if (!field) return;
    setFormErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const errors: FormErrors = {};

    (["name", "phone", "service", "brief"] as RequiredFormField[]).forEach((field) => {
      if (!String(data.get(field) ?? "").trim()) errors[field] = REQUIRED_FORM_MESSAGES[field];
    });

    if (Object.keys(errors).length) {
      setPreparedEmail("");
      setFormErrors(errors);
      const firstInvalid = (["name", "phone", "service", "brief"] as RequiredFormField[])
        .find((field) => errors[field]);
      if (firstInvalid) {
        // direct focus: the inputs always exist in the DOM, and rAF is
        // throttled to a halt in background tabs
        (form.elements.namedItem(firstInvalid) as HTMLElement | null)?.focus();
      }
      return;
    }

    const mailto = prepareEmail(form);
    setFormErrors({});
    setPreparedEmail(mailto);
    window.setTimeout(() => {
      window.location.href = mailto;
    }, 0);
  };

  return (
    <>
      <a className="skip-link" href="#main">انتقل إلى المحتوى</a>

      <header className="public-header">
        <div className="container public-header__inner">
          <a className="brand-link" href="#home" aria-label="صَوْغ — الرئيسية">
            <img src="/brand/sogh-lockup-bilingual-horizontal.svg" alt="صَوْغ | SOGH" />
          </a>

          <button
            className="menu-toggle"
            type="button"
            aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={menuOpen}
            aria-controls="public-navigation"
            data-testid="menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
          </button>

          <nav
            id="public-navigation"
            className={`public-nav ${menuOpen ? "is-open" : ""}`}
            aria-label="التنقل الرئيسي"
          >
            {NAVIGATION.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className={id === "start" ? "public-nav__cta" : ""}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main id="main">
        <section className={motionAllowed ? "hero section hero--motion" : "hero section"} id="home">
          <div className="container hero__grid">
            <div className="hero__copy">
              <p className="eyebrow ltr">SOGH — CRAFTED FOR GROWTH</p>
              <h1 className="hero-title" aria-label="نصوغ العلامات للنمو.">
                <span className="hero-title__line" aria-hidden="true">نصوغ</span>
                <span className="hero-title__line" aria-hidden="true">العلامات</span>
                <span className="hero-title__line hero-title__accent" aria-hidden="true">
                  للنمو<span className="hero-title__punctuation">.</span>
                </span>
              </h1>
              <p className="hero__lead">
                استراتيجية، هوية، محتوى وتجارب رقمية ضمن نظام واحد يفهم مشروعك
                قبل أن يبدأ التنفيذ.
              </p>
              <div className="button-row">
                <a className="button" href="#start">ابدأ مشروعك</a>
                <a className="button button--ghost" href="#method">شاهد كيف نعمل</a>
              </div>
            </div>

            <div className="hero__craft" aria-label="من الفكرة الخام إلى علامة واضحة">
              <div className="hero__raw" aria-hidden="true">
                <span />
                <span />
                <span />
                <small className="ltr">RAW / SIGNAL / IDEA</small>
              </div>
              <SignalMark
                stroke="var(--ink)"
                accent="var(--cobalt)"
                className="hero__signalmark"
              />
              <ArabicWordmark
                stroke="var(--ink)"
                accent="var(--cobalt)"
                className="hero__wordmark"
              />
              <p>من معطيات متفرقة إلى نظام واضح قابل للنمو.</p>
            </div>
          </div>
        </section>

        <section className="section services" id="services">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow ltr">WHAT WE CRAFT</p>
              <h2>خدماتنا.</h2>
              <p>شريك واحد يربط الاستراتيجية بالتنفيذ، ويثبت النطاق قبل أن يبدأ العمل.</p>
            </div>
            <div className="services__grid">
              {SERVICES.map((service) => (
                <article className="service-card" key={service.number}>
                  <div className="service-card__top">
                    <span className="ltr">{service.number}</span>
                    <img src="/brand/sogh-mark-unit.svg" alt="" aria-hidden="true" />
                  </div>
                  <h3>{service.title}</h3>
                  <p>{service.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section method" id="method">
          <div className="container">
            <div className="section-heading section-heading--wide">
              <p className="eyebrow ltr">HOW WE WORK</p>
              <h2
                className="display-title display-title--wide"
                aria-label="لا نبدأ بالتصميم. نبدأ بالسؤال الصحيح."
              >
                <span className="display-title__line" aria-hidden="true">لا نبدأ بالتصميم.</span>
                <span className="display-title__line" aria-hidden="true">نبدأ بالسؤال الصحيح.</span>
              </h2>
            </div>
            <div className="method__steps">
              {METHOD.map(([number, title, copy]) => (
                <article key={number}>
                  <span className="ltr">{number}</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section work" id="work">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow ltr">ILLUSTRATIVE PATHS</p>
              <h2 className="display-title display-title--work" aria-label="نماذج لمسارات العمل.">
                <span className="display-title__line" aria-hidden="true">نماذج لمسارات</span>
                <span className="display-title__line" aria-hidden="true">العمل.</span>
              </h2>
              <p>
                الأمثلة التالية توضيحية وصادقة، وليست أعمالًا منسوبة لعملاء.
                تنشر دراسات الحالة الفعلية فقط بعد موافقة العميل.
              </p>
            </div>
            <div className="work__grid">
              {WORK_PATHS.map((item) => (
                <article className={`work-card work-card--${item.tone}`} key={item.eyebrow}>
                  <div className="work-card__visual" aria-hidden="true">
                    <img
                      src={item.tone === "dark" ? "/brand/sogh-mark-signal-white.svg" : "/brand/sogh-mark-unit.svg"}
                      alt=""
                    />
                  </div>
                  <p className="eyebrow ltr">{item.eyebrow}</p>
                  <h3 className="card-heading">{item.title}</h3>
                  <p>{item.copy}</p>
                  <ul aria-label="مجالات المسار">
                    {item.tags.map((tag) => <li key={tag}>{tag}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          ref={aiBand.ref}
          className={
            !motionAllowed
              ? "section ai-band"
              : aiBand.inView
                ? "section ai-band is-inview"
                : "section ai-band motion-armed"
          }
          aria-labelledby="ai-title"
        >
          <div className="container ai-band__grid">
            <div className="ai-band__mark" aria-hidden="true">
              <SignalMark stroke="var(--ivory)" accent="var(--cobalt)" className="ai-band__signal" />
            </div>
            <div>
              <p className="eyebrow ltr">HUMAN-LED INTELLIGENCE</p>
              <h2
                className="display-title"
                id="ai-title"
                aria-label="الذكاء يسرّع العمل. الحِرفة تصنع الفرق."
              >
                <span className="display-title__line" aria-hidden="true">الذكاء يسرّع العمل.</span>
                <span className="display-title__line" aria-hidden="true">الحِرفة تصنع الفرق.</span>
              </h2>
              <p>
                يسرّع الذكاء الاصطناعي البحث وتنظيم المعرفة والإنتاج والاختبار،
                بينما تبقى القرارات والاستراتيجية والمسؤولية والجودة تحت قيادة
                بشرية.
              </p>
            </div>
          </div>
        </section>

        <section className="section about" id="about">
          <div className="container about__grid">
            <div>
              <p className="eyebrow ltr">ABOUT SOGH</p>
              <h2 className="display-title" aria-label="نفهم قبل أن نصوغ.">
                <span className="display-title__line" aria-hidden="true">نفهم قبل أن</span>
                <span className="display-title__line" aria-hidden="true">نصوغ.</span>
              </h2>
            </div>
            <div className="about__copy">
              <p className="about__lead">
                صَوْغ وكالة سعودية تجمع الاستراتيجية والإبداع والذكاء الاصطناعي
                لبناء علامات واضحة، محتوى متماسك وتجارب رقمية قابلة للنمو.
              </p>
              <p>
                نربط القرار الإبداعي بهدف واضح ونطاق مكتوب ومخرجات قابلة
                للمراجعة، من دون وعود بنتائج مضمونة أو إنتاج آلي بلا مسؤولية.
              </p>
            </div>
          </div>
        </section>

        <section className="section start" id="start">
          <div className="container start__grid">
            <div className="start__intro">
              <p className="eyebrow ltr">START A PROJECT</p>
              <h2>لنتحدث عن مشروعك.</h2>
              <p>
                شاركنا السياق والاحتياج، ثم راجع الرسالة الجاهزة في تطبيق
                البريد قبل إرسالها.
              </p>
              <div className="direct-contact" aria-label="قنوات التواصل المباشر">
                <a href={phoneHref}><span>هاتف</span><bdi>{contact.phone}</bdi></a>
                <a href={emailHref}><span>بريد</span><bdi>{contact.email}</bdi></a>
                {socialLinks.map((item) => (
                  <a key={item.id} href={item.href} target="_blank" rel="noreferrer">
                    <span>{item.label}</span><bdi>{item.handle}</bdi>
                  </a>
                ))}
              </div>
            </div>

            <form className="project-form" onSubmit={onSubmit} noValidate>
              <div className="form-grid">
                <label>
                  <span>الاسم <b className="required-mark" aria-hidden="true">*</b></span>
                  <input
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    aria-invalid={Boolean(formErrors.name)}
                    aria-describedby={formErrors.name ? "name-error" : undefined}
                    onInput={() => clearFieldError("name")}
                  />
                  {formErrors.name && <small className="form-error" id="name-error">{formErrors.name}</small>}
                </label>
                <label>
                  <span>الشركة أو المشروع <small>(اختياري)</small></span>
                  <input
                    name="company"
                    type="text"
                    autoComplete="organization"
                    onInput={() => clearFieldError()}
                  />
                </label>
                <label>
                  <span>الهاتف <b className="required-mark" aria-hidden="true">*</b></span>
                  <input
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    dir="ltr"
                    required
                    aria-invalid={Boolean(formErrors.phone)}
                    aria-describedby={formErrors.phone ? "phone-error" : undefined}
                    onInput={() => clearFieldError("phone")}
                  />
                  {formErrors.phone && <small className="form-error" id="phone-error">{formErrors.phone}</small>}
                </label>
                <label>
                  <span>الخدمة المطلوبة <b className="required-mark" aria-hidden="true">*</b></span>
                  <select
                    name="service"
                    defaultValue=""
                    required
                    aria-invalid={Boolean(formErrors.service)}
                    aria-describedby={formErrors.service ? "service-error" : undefined}
                    onInput={() => clearFieldError("service")}
                  >
                    <option value="" disabled>اختر الخدمة المطلوبة</option>
                    {SERVICES.map((service) => (
                      <option key={service.number} value={service.title}>{service.title}</option>
                    ))}
                  </select>
                  {formErrors.service && <small className="form-error" id="service-error">{formErrors.service}</small>}
                </label>
              </div>
              <label>
                <span>نبذة المشروع <b className="required-mark" aria-hidden="true">*</b></span>
                <textarea
                  name="brief"
                  rows={6}
                  required
                  aria-invalid={Boolean(formErrors.brief)}
                  aria-describedby={formErrors.brief ? "brief-error" : undefined}
                  onInput={() => clearFieldError("brief")}
                />
                {formErrors.brief && <small className="form-error" id="brief-error">{formErrors.brief}</small>}
              </label>
              <div className="form-actions">
                <button className="button" type="submit">افتح رسالة المشروع في البريد</button>
                <div className="form-actions__note">
                  <small>عند الإرسال سيفتح تطبيق البريد برسالة جاهزة إلى فريق صَوْغ.</small>
                  <small>لا يرسل الموقع البيانات إلى خادم ولا يحتفظ بها.</small>
                </div>
              </div>
              {preparedEmail && (
                <div className="prepared-email" role="status">
                  <p>تم تجهيز الرسالة. راجعها في تطبيق البريد قبل الإرسال.</p>
                  <a className="button button--dark" href={preparedEmail} data-testid="prepared-email">
                    افتح رسالة البريد
                  </a>
                </div>
              )}
            </form>
          </div>
        </section>
      </main>

      <footer className="public-footer">
        <div className="container public-footer__grid">
          <div>
            <img src="/brand/sogh-lockup-bilingual-horizontal-white.svg" alt="صَوْغ | SOGH" />
            <p>نصوغ العلامات للنمو.</p>
          </div>
          <div className="public-footer__contact">
            <a href={phoneHref}><bdi>{contact.phone}</bdi></a>
            <a href={emailHref}><bdi>{contact.email}</bdi></a>
            {socialLinks.map((item) => (
              <a key={item.id} href={item.href} target="_blank" rel="noreferrer">
                {item.label} <bdi>{item.handle}</bdi>
              </a>
            ))}
          </div>
          <small className="ltr">SOGH — CRAFTED FOR GROWTH · 2026</small>
        </div>
      </footer>
    </>
  );
}
