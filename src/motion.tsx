import { useEffect, useRef, useState } from "react";

/**
 * SOGH brand motion — inline SVG marks + hooks for the public website.
 *
 * Path data mirrors the approved masters in the canonical brand repo
 * (sogh-brand/src/svg/paths.ts). Never edit the letterforms here; change
 * them in the canonical repo first, then mirror.
 *
 * Motion contract (approved identity rules):
 * - the signal always resolves from noise (right) to clarity (left);
 * - the cobalt point is the moment of completion — it never appears first;
 * - every sequence plays once, then the final state is fully static;
 * - under prefers-reduced-motion the final state renders immediately
 *   (no dash styles exist outside the motion classes).
 */

/* ---------- approved paths (mirror of canonical src/svg/paths.ts) ---------- */

const AR = {
  sadLoop:
    "M 386 126 C 372 106 336 100 318 112 C 306 120 306 136 318 143 C 336 153 372 147 386 126 Z",
  sadBody:
    "M 320 143 C 312 150 306 150 300 150 L 296 150 C 292 150 291 139 287 139 C 283 139 282 150 278 150 L 250 150",
  wawHead: { cx: 236, cy: 133, r: 17 },
  wawTail: "M 245 144 C 254 170 236 194 204 192",
  ghainHead: "M 178 96 C 156 88 138 96 140 110 C 141 122 158 126 172 120",
  ghainBowl: "M 172 120 C 138 128 116 150 124 178 C 130 198 164 204 182 184",
  ghainDot: { cx: 152, cy: 64, r: 7 },
  fatha: "M 332 78 L 366 66",
  sukun: { cx: 236, cy: 92, r: 8 },
};

const SIGNAL = {
  noise: "M 592 40 L 578 16 L 564 62 L 550 22 L 538 58 L 526 30 L 514 50 L 502 36",
  clear: "M 502 36 C 470 41 440 40 400 40 L 80 40",
  dot: { cx: 48, cy: 40, r: 9 },
};

/* ---------- marks ---------- */

/**
 * الشعار العربي المعتمد — stroke construction, draw-on ready via CSS classes.
 *
 * Not rendered by the current page: the header and footer use the approved
 * SVG lockups, and the hero carries the ForgeField motif. It is kept here as
 * the mirror of the canonical letterforms so an animated wordmark never gets
 * redrawn from scratch when one is next needed.
 */
export function ArabicWordmark({
  stroke,
  accent,
  className,
}: {
  stroke: string;
  accent: string;
  className?: string;
}) {
  const letter = {
    fill: "none",
    stroke,
    strokeWidth: 14,
    strokeLinecap: "butt" as const,
    strokeLinejoin: "round" as const,
    pathLength: 1,
  };
  return (
    <svg viewBox="0 0 420 240" role="img" aria-label="شعار صَوْغ" className={className}>
      <title>صَوْغ</title>
      <path d={AR.sadLoop} className="wm-p1" {...letter} />
      <path d={AR.sadBody} className="wm-p2" {...letter} />
      <circle
        cx={AR.wawHead.cx}
        cy={AR.wawHead.cy}
        r={AR.wawHead.r}
        className="wm-p3"
        fill="none"
        stroke={stroke}
        strokeWidth={14}
        pathLength={1}
      />
      <path d={AR.wawTail} className="wm-p4" {...letter} />
      <path d={AR.ghainHead} className="wm-p5" {...letter} />
      <path d={AR.ghainBowl} className="wm-p6" {...letter} />
      <circle cx={AR.ghainDot.cx} cy={AR.ghainDot.cy} r={AR.ghainDot.r} className="wm-d1" fill={accent} />
      <path
        d={AR.fatha}
        className="wm-d2"
        fill="none"
        stroke={accent}
        strokeWidth={11}
        strokeLinecap="butt"
        pathLength={1}
      />
      <circle
        cx={AR.sukun.cx}
        cy={AR.sukun.cy}
        r={AR.sukun.r}
        className="wm-d3"
        fill="none"
        stroke={accent}
        strokeWidth={7}
        pathLength={1}
      />
    </svg>
  );
}

/** خط الإشارة المعتمد — from noise (right) to clarity (left), cobalt point last. */
export function SignalMark({
  stroke,
  accent,
  className,
}: {
  stroke: string;
  accent: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 600 80"
      role="img"
      aria-label="من الفكرة الخام إلى علامة واضحة"
      className={className}
    >
      <path
        d={SIGNAL.noise}
        className="sig-noise"
        fill="none"
        stroke={stroke}
        strokeWidth={6}
        strokeLinejoin="round"
        pathLength={1}
      />
      <path
        d={SIGNAL.clear}
        className="sig-clear"
        fill="none"
        stroke={stroke}
        strokeWidth={6}
        strokeLinecap="butt"
        pathLength={1}
      />
      <circle cx={SIGNAL.dot.cx} cy={SIGNAL.dot.cy} r={SIGNAL.dot.r} className="sig-dot" fill={accent} />
    </svg>
  );
}

/* ---------- hooks ---------- */

/** true when the visitor allows motion — read once, before first paint of #root. */
export function useMotionAllowed(): boolean {
  const [allowed] = useState(
    () =>
      typeof window !== "undefined" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  return allowed;
}

/**
 * Live in-view state — unlike `useInViewOnce` it follows the element both ways.
 *
 * Used for the hand-off between the client marquee and the positioning
 * statement: the marquee softens as the statement arrives and comes back if
 * the visitor scrolls up again, so the effect reads as a relationship between
 * the two sections rather than a one-way switch that fired once.
 */
export function useInView<T extends HTMLElement>(
  enabled: boolean,
  options?: IntersectionObserverInit,
) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => setInView(entries.some((entry) => entry.isIntersecting)),
      options,
    );
    io.observe(el);
    return () => io.disconnect();
  }, [enabled, options]);

  return { ref, inView };
}

/** adds the returned ref to a section; fires true once when ~a third is visible. */
export function useInViewOnce<T extends HTMLElement>(enabled: boolean) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(!enabled);

  useEffect(() => {
    if (!enabled || inView) return;
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [enabled, inView]);

  return { ref, inView };
}
