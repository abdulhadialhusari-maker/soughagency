import { SERVICE_GROUPS } from "../data/services";
import { ServiceIcon } from "./glyphs";
import { Reveal } from "./Reveal";

/**
 * Five capability rows, separated by hairlines.
 *
 * Not cards. Positioning states how the agency thinks; this states what it
 * builds, so it should read as a system rather than a set of tiles. Rows use
 * their full width — the previous wide cells left the right 40% carrying the
 * text and the rest empty — and they reuse the hairline-separated language the
 * positioning list already establishes, so the two sections continue.
 *
 * Each row is one article: number and mark, then the group, then the outcome it
 * produces, then what is inside it. Nothing is hidden behind hover.
 */
export function Services() {
  return (
    <section className="section services" id="services" aria-labelledby="services-title">
      <div className="container">
        <div className="head head--split services__head">
          <div>
            <p className="eyebrow">
              <span className="ltr">What we do</span>
            </p>
            <h2 className="display" id="services-title">
              <span className="display__line">خدماتنا.</span>
            </h2>
          </div>
          <p className="prose services__intro">
            خمس مجموعات مترابطة، لا قائمة منصات. كل مجموعة مرتبطة بنتيجة تجارية
            نتفق عليها قبل أن يبدأ العمل.
          </p>
        </div>

        <ul className="services__list">
          {SERVICE_GROUPS.map((group, i) => (
            <Reveal as="li" key={group.id} index={i} className="service">
              <article className="service__row">
                <div className="service__id">
                  <span className="num ltr">{group.number}</span>
                  <ServiceIcon name={group.glyph} />
                </div>

                <h3 className="service__title">{group.title}</h3>

                <p className="service__outcome">{group.outcome}</p>

                <ul className="service__items">
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
