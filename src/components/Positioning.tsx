import { useMemo } from "react";
import { Reveal } from "./Reveal";
import { useInView, useMotionAllowed } from "../motion";

const SYSTEM = [
  { id: "strategy", label: "استراتيجية", note: "تحدد الاتجاه" },
  { id: "creative", label: "إبداع", note: "يصنع الانتباه" },
  { id: "performance", label: "أداء", note: "يحوّل الانتباه إلى طلب" },
  { id: "tech", label: "تقنية", note: "تجعل ما ينجح قابلًا للتكرار" },
] as const;

export function Positioning() {
  const motionAllowed = useMotionAllowed();
  // fires while the top of this section is still below the fold, so the
  // marquee above has already begun receding by the time the statement lands
  const observerOptions = useMemo(
    () => ({ rootMargin: "0px 0px -22% 0px", threshold: 0 }),
    [],
  );
  const handoff = useInView<HTMLElement>(motionAllowed, observerOptions);

  return (
    <section
      ref={handoff.ref}
      className={`section positioning${handoff.inView ? " is-entering" : ""}`}
      aria-labelledby="positioning-title"
    >
      {/*
        The one element bridging the two sections: a hairline dropping out of
        the marquee that lands on the cobalt point the eyebrow starts from.
        Decorative only — the eyebrow below carries the actual meaning.
      */}
      <div className="container positioning__rail" aria-hidden="true">
        <span className="positioning__thread" />
      </div>

      <div className="container positioning__grid">
        <Reveal className="positioning__lede">
          <p className="eyebrow">
            <span className="ltr">Positioning</span>
          </p>
          <h2 className="display positioning__title" id="positioning-title">
            <span className="display__line positioning__line--lead">أكثر من</span>
            <span className="display__line positioning__line--point">وكالة تسويق.</span>
          </h2>
          <p className="lead positioning__statement">
            صَوْغ ليست جهة تنفّذ مهامًا متفرقة. نحن شريك يجمع الاستراتيجية
            والإبداع والأداء والتقنية داخل منظومة واحدة تعمل باتجاه هدف تجاري
            واحد.
          </p>
        </Reveal>

        <Reveal className="positioning__body" index={1}>
          <p className="prose">
            نبدأ من سؤال العمل قبل سؤال المنصة، ونربط كل مخرج بالنتيجة التي
            يفترض أن يحققها — حتى يبقى القرار واضحًا ومسار النمو قابلًا للقياس.
          </p>

          <ul className="positioning__system">
            {SYSTEM.map((item) => (
              <li key={item.id}>
                <span className="positioning__label">{item.label}</span>
                <span className="positioning__note">{item.note}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
