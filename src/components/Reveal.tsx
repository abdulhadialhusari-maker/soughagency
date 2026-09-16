import { ElementType, ReactNode, useEffect, useRef, useState } from "react";
import { useMotionAllowed } from "../motion";

type RevealProps = {
  children: ReactNode;
  /** rendered element; defaults to a div so it stays layout-neutral */
  as?: ElementType;
  className?: string;
  /** stagger index — multiplied by 70ms, capped by the CSS */
  index?: number;
  id?: string;
};

/**
 * Scroll reveal, once, opt-out first.
 *
 * The revealed state is the DEFAULT state: without JS, without an
 * IntersectionObserver, or under prefers-reduced-motion, children render
 * complete and static. Only when motion is allowed does the element start
 * armed and settle in.
 */
export function Reveal({
  children,
  as: Tag = "div",
  className = "",
  index = 0,
  id,
}: RevealProps) {
  const motionAllowed = useMotionAllowed();
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(!motionAllowed);

  useEffect(() => {
    if (!motionAllowed || shown) return;
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [motionAllowed, shown]);

  const state = !motionAllowed ? "" : shown ? " is-revealed" : " is-armed";

  return (
    <Tag
      ref={ref}
      id={id}
      className={`reveal${state}${className ? ` ${className}` : ""}`}
      style={index ? ({ "--reveal-i": index } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}
