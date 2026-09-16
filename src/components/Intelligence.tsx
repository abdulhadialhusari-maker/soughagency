import { INTELLIGENCE_NOTE, INTELLIGENCE_USES } from "../data/intelligence";
import { SignalMark, useInViewOnce, useMotionAllowed } from "../motion";

/**
 * The intelligence band. It describes where AI sits in the work — inside the
 * system, under human decision — and claims no owned platform, because SOGH
 * does not operate one.
 */
export function Intelligence() {
  const motionAllowed = useMotionAllowed();
  const band = useInViewOnce<HTMLElement>(motionAllowed);

  const state = !motionAllowed
    ? ""
    : band.inView
      ? " is-inview"
      : " motion-armed";

  return (
    <section
      ref={band.ref}
      className={`section section--ink on-ink intel${state}`}
      aria-labelledby="intel-title"
    >
      <div className="container">
        <div className="intel__head display-col">
          <p className="eyebrow">
            <span className="ltr">Human-led intelligence</span>
          </p>
          <h2 className="display" id="intel-title">
            <span className="display__line">ذكاء اصطناعي يعمل</span>
            <span className="display__line">داخل المنظومة، لا فوقها.</span>
          </h2>
          <SignalMark
            stroke="var(--ivory)"
            accent="var(--cobalt-soft)"
            className="intel__signal"
          />
        </div>

        <ul className="intel__grid">
          {INTELLIGENCE_USES.map((use, i) => (
            <li key={use.number} style={{ "--reveal-i": i } as React.CSSProperties}>
              <span className="num ltr">{use.number}</span>
              <h3>{use.title}</h3>
              <p>{use.copy}</p>
            </li>
          ))}
        </ul>

        <p className="intel__note">{INTELLIGENCE_NOTE}</p>
      </div>
    </section>
  );
}
