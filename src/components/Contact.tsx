import { FormEvent, useState } from "react";
import { contact, emailHref, phoneHref, socialLinks } from "../contact";
import { SERVICE_OPTIONS } from "../data/services";
import { ArrowIcon } from "./glyphs";

/**
 * The brief form.
 *
 * The delivery channel is unchanged from the version that shipped: the visitor's
 * own mail client, composed from the fields. Nothing is posted to a server and
 * nothing is stored, so there is no backend layer for these rules to mirror —
 * the client-side gate below is the only one, and the note under the button
 * says plainly where the data goes.
 */

const FIELDS = ["name", "phone", "email", "service", "brief"] as const;
type RequiredField = (typeof FIELDS)[number];
type FormErrors = Partial<Record<RequiredField, string>>;

const EMPTY_MESSAGE: Record<RequiredField, string> = {
  name: "يرجى كتابة الاسم.",
  phone: "يرجى كتابة رقم الجوال.",
  email: "يرجى كتابة البريد الإلكتروني.",
  service: "يرجى اختيار الخدمة المطلوبة.",
  brief: "يرجى كتابة نبذة مختصرة عن المشروع.",
};

/** deliberately permissive: it catches typos, it does not police formats */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(data: FormData): FormErrors {
  const read = (key: string) => String(data.get(key) ?? "").trim();
  const errors: FormErrors = {};

  for (const field of FIELDS) {
    if (!read(field)) errors[field] = EMPTY_MESSAGE[field];
  }

  const phone = read("phone");
  if (phone && (phone.match(/\d/g) ?? []).length < 9) {
    errors.phone = "يرجى كتابة رقم جوال صحيح.";
  }

  const email = read("email");
  if (email && !EMAIL_SHAPE.test(email)) {
    errors.email = "يرجى كتابة بريد إلكتروني صحيح.";
  }

  return errors;
}

function composeMailto(data: FormData) {
  const read = (key: string) => String(data.get(key) ?? "").trim();
  const subject = `طلب مشروع جديد — ${read("company") || read("name")}`;
  const body = [
    "مرحبًا فريق صَوْغ،",
    "",
    `الاسم: ${read("name")}`,
    `الشركة أو المشروع: ${read("company") || "غير محدد"}`,
    `الجوال: ${read("phone")}`,
    `البريد الإلكتروني: ${read("email")}`,
    `الخدمة المطلوبة: ${read("service")}`,
    "",
    "نبذة عن المشروع:",
    read("brief"),
  ].join("\n");

  return `mailto:${contact.email}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
}

export function Contact() {
  const [errors, setErrors] = useState<FormErrors>({});
  const [prepared, setPrepared] = useState("");

  const clear = (field?: RequiredField) => {
    setPrepared("");
    if (!field) return;
    setErrors((current) => {
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
    const found = validate(data);

    if (Object.keys(found).length) {
      setPrepared("");
      setErrors(found);
      const first = FIELDS.find((name) => found[name]);
      if (first) (form.elements.namedItem(first) as HTMLElement | null)?.focus();
      return;
    }

    const mailto = composeMailto(data);
    setErrors({});
    setPrepared(mailto);
    window.setTimeout(() => {
      window.location.href = mailto;
    }, 0);
  };

  const bind = (name: RequiredField) => ({
    name,
    required: true,
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
    onInput: () => clear(name),
  });

  return (
    <section
      className="section section--hairline contact"
      id="contact"
      aria-labelledby="contact-title"
    >
      <div className="container contact__grid">
        <div className="contact__intro display-col">
          <p className="eyebrow">
            <span className="ltr">Start a project</span>
          </p>
          <h2 className="display" id="contact-title">
            <span className="display__line">خلّنا نصوغ</span>
            <span className="display__line">خطوتك القادمة.</span>
          </h2>
          <p className="lead">
            شاركنا التحدي أو الفكرة، ونساعدك في تحديد الخطوة الأنسب لنمو مشروعك.
          </p>

          <ul className="contact__direct" aria-label="قنوات التواصل المباشر">
            <li>
              <a href={phoneHref}>
                <span>جوال</span>
                <bdi>{contact.phone}</bdi>
              </a>
            </li>
            <li>
              <a href={emailHref}>
                <span>بريد</span>
                <bdi>{contact.email}</bdi>
              </a>
            </li>
            {socialLinks.map((item) => (
              <li key={item.id}>
                <a href={item.href} target="_blank" rel="noreferrer">
                  <span>{item.label}</span>
                  <bdi>{item.handle}</bdi>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <form className="form" onSubmit={onSubmit} noValidate>
          <div className="form__grid">
            <p className="form__field">
              <label htmlFor="f-name">
                الاسم{" "}
                <b className="form__required" aria-hidden="true">
                  *
                </b>
              </label>
              <input id="f-name" type="text" autoComplete="name" {...bind("name")} />
              {errors.name && (
                <small className="form__error" id="name-error">
                  {errors.name}
                </small>
              )}
            </p>

            <p className="form__field">
              <label htmlFor="f-company">
                اسم الشركة <small>(اختياري)</small>
              </label>
              <input
                id="f-company"
                name="company"
                type="text"
                autoComplete="organization"
                onInput={() => clear()}
              />
            </p>

            <p className="form__field">
              <label htmlFor="f-phone">
                رقم الجوال{" "}
                <b className="form__required" aria-hidden="true">
                  *
                </b>
              </label>
              <input
                id="f-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                dir="ltr"
                {...bind("phone")}
              />
              {errors.phone && (
                <small className="form__error" id="phone-error">
                  {errors.phone}
                </small>
              )}
            </p>

            <p className="form__field">
              <label htmlFor="f-email">
                البريد الإلكتروني{" "}
                <b className="form__required" aria-hidden="true">
                  *
                </b>
              </label>
              <input
                id="f-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                dir="ltr"
                {...bind("email")}
              />
              {errors.email && (
                <small className="form__error" id="email-error">
                  {errors.email}
                </small>
              )}
            </p>

            <p className="form__field form__field--wide">
              <label htmlFor="f-service">
                الخدمة المطلوبة{" "}
                <b className="form__required" aria-hidden="true">
                  *
                </b>
              </label>
              <select id="f-service" defaultValue="" {...bind("service")}>
                <option value="" disabled>
                  اختر الخدمة المطلوبة
                </option>
                {SERVICE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.service && (
                <small className="form__error" id="service-error">
                  {errors.service}
                </small>
              )}
            </p>

            <p className="form__field form__field--wide">
              <label htmlFor="f-brief">
                نبذة عن المشروع{" "}
                <b className="form__required" aria-hidden="true">
                  *
                </b>
              </label>
              <textarea id="f-brief" rows={5} {...bind("brief")} />
              {errors.brief && (
                <small className="form__error" id="brief-error">
                  {errors.brief}
                </small>
              )}
            </p>
          </div>

          <div className="form__actions">
            <button className="btn" type="submit">
              أرسل الطلب
              <ArrowIcon />
            </button>
            <small className="form__note">
              يفتح الطلب رسالة جاهزة في تطبيق البريد لديك. لا يرسل الموقع بياناتك
              إلى أي خادم ولا يحتفظ بها.
            </small>
          </div>

          <div className="form__status" role="status" aria-live="polite">
            {prepared && (
              <div className="form__prepared">
                <p>تم تجهيز رسالتك. راجعها في تطبيق البريد ثم أرسلها.</p>
                <a
                  className="btn btn--ghost"
                  href={prepared}
                  data-testid="prepared-email"
                >
                  افتح الرسالة
                </a>
              </div>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
