/**
 * من نحن — the agency, not the roster.
 *
 * The team block was removed by owner decision (2026-09-09): no member cards,
 * no names, no roles, and no `Person` entries in the structured data. If it is
 * ever reinstated, it comes back as its own component with approved
 * photography — not as a list of monograms.
 */
export function About() {
  return (
    <section className="section section--plain about" id="about" aria-labelledby="about-title">
      <div className="container about__grid">
        <div>
          <p className="eyebrow">
            <span className="ltr">About SOGH</span>
          </p>
          <h2 className="display" id="about-title">
            <span className="display__line">نفهم قبل</span>
            <span className="display__line">أن نصوغ.</span>
          </h2>
        </div>

        <div className="about__copy">
          <p className="lead">
            صَوْغ وكالة سعودية تجمع الاستراتيجية والإبداع والأداء والتقنية لبناء
            علامات واضحة وتجارب رقمية قابلة للنمو.
          </p>
          <p className="prose">
            نعمل بنطاق مكتوب ومخرجات قابلة للمراجعة، ونربط كل قرار إبداعي بهدف
            تجاري محدد — من دون وعود بنتائج مضمونة.
          </p>

          <ul className="about__points">
            <li>
              <span className="num ltr">01</span>
              <p>نبدأ من سؤال العمل، لا من سؤال المنصة.</p>
            </li>
            <li>
              <span className="num ltr">02</span>
              <p>نثبّت النطاق والمخرجات قبل أن يبدأ التنفيذ.</p>
            </li>
            <li>
              <span className="num ltr">03</span>
              <p>نقيس ما ننفذه، ونوسّع ما يثبت نجاحه.</p>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
