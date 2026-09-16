import { useEffect, useId, useRef, useState } from "react";
import { NAV, PRIMARY_CTA } from "../data/site";
import { HAS_CASE_STUDIES } from "../data/work";

/** «أعمالنا» only appears once a documented case study exists. */
const ITEMS = HAS_CASE_STUDIES
  ? [
      ...NAV.slice(0, 3),
      { id: "work", label: "أعمالنا" },
      ...NAV.slice(3),
    ]
  : NAV;

export function Header() {
  const [open, setOpen] = useState(false);
  const [condensed, setCondensed] = useState(false);
  const navId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  /* quiet condense on scroll — a border and a tighter bar, nothing that moves */
  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Escape closes and returns focus to the control that opened it */
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || toggleRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <header className={`site-header${condensed ? " is-condensed" : ""}`}>
      <div className="container site-header__inner">
        <a className="site-header__brand" href="#home" aria-label="صَوْغ — الرئيسية">
          <img
            src="/brand/sogh-lockup-bilingual-horizontal.svg"
            alt="صَوْغ | SOGH"
            width={148}
            height={34}
          />
        </a>

        <nav
          id={navId}
          ref={panelRef}
          className={`site-nav${open ? " is-open" : ""}`}
          aria-label="التنقل الرئيسي"
        >
          <ul className="site-nav__list">
            {ITEMS.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} onClick={() => setOpen(false)}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <a className="btn site-nav__cta" href={`#${PRIMARY_CTA.id}`} onClick={() => setOpen(false)}>
            {PRIMARY_CTA.label}
          </a>
        </nav>

        <button
          ref={toggleRef}
          className="menu-toggle"
          type="button"
          aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
          aria-expanded={open}
          aria-controls={navId}
          data-testid="menu-toggle"
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
