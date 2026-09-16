import { ForgeField } from "./ForgeField";
import { ArrowIcon } from "./glyphs";
import { useMotionAllowed } from "../motion";

/**
 * The first screen states the business, the outcome, and the next step, and
 * keeps the primary action above the fold on the common viewports.
 */
export function Hero() {
  const motionAllowed = useMotionAllowed();

  return (
    <section className={`hero${motionAllowed ? " hero--motion" : ""}`} id="home">
      <div className="container hero__grid">
        <div className="hero__copy display-col">
          <p className="eyebrow">
            <span className="ltr">SOGH — Growth, Creative &amp; AI</span>
          </p>

          {/* two deliberate lines: the promise, then the measure */}
          <h1 className="display display--lg hero__title">
            <span className="display__line">نصوغ الأفكار إلى</span>
            <span className="display__line hero__accent">
              نمو قابل للقياس
              <span className="hero__stop" aria-hidden="true">
                .
              </span>
            </span>
          </h1>

          <p className="lead hero__lead">
            نحوّل الاستراتيجية والإبداع والتقنية إلى تجارب تسويقية تصنع أثرًا
            حقيقيًا لأعمالك.
          </p>

          <div className="btn-row hero__actions">
            <a className="btn" href="#contact">
              ابدأ مشروعك
              <ArrowIcon />
            </a>
            <a className="btn btn--ghost" href="#services">
              اكتشف خدماتنا
            </a>
          </div>

          <ul className="hero__pillars">
            <li>استراتيجية</li>
            <li>إبداع</li>
            <li>أداء</li>
            <li>ذكاء اصطناعي</li>
          </ul>
        </div>

        <figure className="hero__figure">
          <ForgeField className="hero__forge" />
          <figcaption className="hero__caption">
            <span className="num ltr">SOGH METHOD</span>
            من معطيات متفرقة إلى مسار نمو واضح.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
