import { METHOD } from "../data/method";
import { useInViewOnce, useMotionAllowed } from "../motion";

/**
 * The four stages are drawn as one continuous run on a single rail — a hairline
 * that fills from the first stage to the last as the section comes into view —
 * rather than four repeated cards. The rail is horizontal from the wide
 * breakpoint and vertical below it; in both directions it starts at the
 * inline-start edge, so it reads right-to-left with the rest of the page.
 *
 * The section carries no top border. Services above it is the same ivory and
 * already closes on a container-width rule, so a full-bleed section rule landed
 * a second competing hairline across the join. The padding does the separating.
 */
export function Method() {
  const motionAllowed = useMotionAllowed();
  const band = useInViewOnce<HTMLElement>(motionAllowed);

  const state = !motionAllowed ? "" : band.inView ? " is-running" : " is-armed";

  return (
    <section
      ref={band.ref}
      className={`section method${state}`}
      id="method"
      aria-labelledby="method-title"
    >
      <div className="container">
        <div className="head head--split">
          <div>
            <p className="eyebrow">
            <span className="ltr">How we work</span>
          </p>
            <h2 className="display" id="method-title">
              <span className="display__line">منهج صَوْغ.</span>
            </h2>
          </div>
          <p className="prose method__intro">
            أربع مراحل متصلة. لا نبدأ بالتصميم — نبدأ بالسؤال الصحيح، وننتهي عند
            ما يمكن قياسه وتوسيعه.
          </p>
        </div>

        <ol className="method__run">
          <span className="method__rail" aria-hidden="true">
            <span className="method__rail-fill" />
          </span>

          {METHOD.map((stage, i) => (
            <li
              className="method__stage"
              key={stage.number}
              style={{ "--stage-i": i } as React.CSSProperties}
            >
              <span className="method__node" aria-hidden="true" />
              <span className="num ltr method__number">{stage.number}</span>
              <h3 className="method__stage-title">{stage.title}</h3>
              <p className="method__copy">{stage.copy}</p>
              <span className="method__marker ltr" aria-hidden="true">
                {stage.marker}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
