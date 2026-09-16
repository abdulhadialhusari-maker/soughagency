import { CASE_STUDIES, HAS_CASE_STUDIES } from "../data/work";
import { ProjectCaseStudy } from "./ProjectCaseStudy";
import { Reveal } from "./Reveal";

/**
 * The proof chapter. Everything above it makes a claim; this is where the
 * claims are evidenced.
 *
 * Still absent from the DOM when no publishable study exists — an empty
 * portfolio is worse than none, and an invented one worse still. The intro is
 * deliberately quiet: this section's peak is the work, not its own heading.
 *
 * Media alternates sides by default, but a study with no publishable visual
 * leaves the alternation rather than breaking it, so `flip` is counted over the
 * studies that actually carry media instead of over the index.
 */
export function Work() {
  if (!HAS_CASE_STUDIES) return null;

  let mediaSeen = -1;

  return (
    <section className="section work" id="work" aria-labelledby="work-title">
      <div className="container">
        <div className="head head--split work__head">
          <div>
            <p className="eyebrow">
              <span className="ltr">Selected work</span>
            </p>
            <h2 className="display" id="work-title">
              <span className="display__line">مشاريع تصنع أثرًا.</span>
            </h2>
          </div>
          <p className="prose work__intro">
            من الفكرة إلى التنفيذ، نعمل مع علامات تختار أن تبني للمستقبل. هذه
            بعض المشاريع التي نفخر بصناعتها معًا.
          </p>
        </div>

        <ul className="work__list">
          {CASE_STUDIES.map((study, i) => {
            if (study.media.length) mediaSeen += 1;
            return (
              <Reveal as="li" key={study.id} index={i} className="work__item">
                <ProjectCaseStudy study={study} flip={mediaSeen % 2 === 1} />
              </Reveal>
            );
          })}
        </ul>

        {/* a quiet close, not a second CTA section — the dark chapter is next */}
        <Reveal className="work__close">
          <p className="work__close-line">لنصنع مشروعك القادم.</p>
          <a className="link work__close-link" href="#contact">
            تواصل معنا
          </a>
        </Reveal>
      </div>
    </section>
  );
}
