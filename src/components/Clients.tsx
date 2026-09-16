import { AVAILABLE_CLIENT_LOGOS, type ClientLogo } from "../data/clients";

/**
 * Client logos, as a continuous marquee.
 *
 * Logos only — no name, no sector, no figure, no quote, no link. Nothing in
 * this subtree is focusable or clickable, and no logo carries visible text.
 *
 * The sequence is rendered twice. The first list is the real one and carries
 * the accessible label; the second is a visual filler marked `aria-hidden` with
 * empty alts, so a screen reader hears the six clients once rather than twelve.
 *
 * Seamlessness depends on the track translating by exactly one sequence width.
 * That is why the spacing lives in `margin-inline-end` on every slot rather
 * than in `gap`: with a trailing margin each slot's footprint is identical, so
 * twelve slots are exactly twice six and `translateX(-50%)` lands on the join.
 * A `gap` would leave one fewer gap than slots and the loop would jump.
 */

function LogoSlot({ logo, hidden }: { logo: ClientLogo & { src: string }; hidden: boolean }) {
  return (
    <li
      className={`clients__item${logo.plate ? " clients__item--plate" : ""}`}
      style={
        {
          "--logo-w": `${logo.box.w}%`,
          "--logo-h-frac": logo.box.h / 100,
        } as React.CSSProperties
      }
    >
      <img
        src={logo.src}
        alt={hidden ? "" : logo.alt}
        width={logo.width}
        height={logo.height}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    </li>
  );
}

export function Clients() {
  if (!AVAILABLE_CLIENT_LOGOS.length) return null;

  return (
    <section className="section section--tight clients" aria-labelledby="clients-title">
      <div className="container">
        <h2 className="clients__title" id="clients-title">
          عملاؤنا
        </h2>
      </div>

      <div className="clients__viewport">
        <div className="clients__track">
          <ul className="clients__seq" aria-label="عملاء صَوْغ">
            {AVAILABLE_CLIENT_LOGOS.map((logo) => (
              <LogoSlot key={logo.id} logo={logo} hidden={false} />
            ))}
          </ul>
          <ul className="clients__seq clients__seq--clone" aria-hidden="true">
            {AVAILABLE_CLIENT_LOGOS.map((logo) => (
              <LogoSlot key={`clone-${logo.id}`} logo={logo} hidden />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
