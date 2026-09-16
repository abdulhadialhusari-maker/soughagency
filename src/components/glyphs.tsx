import type { ServiceGlyph } from "../data/services";

/**
 * Original line glyphs for the service groups.
 *
 * Drawn on one 32-unit grid with one stroke weight so the set reads as a
 * system. Each glyph states what the group produces — a trajectory, reach,
 * composition, a frame, a network — rather than illustrating a tool. No brain,
 * robot, or chip metaphors: the intelligence group is a graph of connected
 * nodes, which is what an automated system actually looks like.
 *
 * The last node of each glyph is the cobalt point — the brand's "moment of
 * completion" — so the accent always lands where the value lands.
 */

const BASE = {
  viewBox: "0 0 32 32",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
  focusable: "false" as const,
};

const POINT = { fill: "var(--cobalt)", stroke: "none" };

function Trajectory() {
  return (
    <svg {...BASE} className="glyph">
      <path d="M4 27h24" opacity=".35" />
      <path d="M4 27V5" opacity=".35" />
      <path d="M7 22.5l5.5-5.5 4.5 4 7.5-11" />
      <circle cx="12.5" cy="17" r="1.5" />
      <circle cx="17" cy="21" r="1.5" />
      <circle cx="24.5" cy="10" r="2.4" {...POINT} />
    </svg>
  );
}

function Reach() {
  return (
    <svg {...BASE} className="glyph">
      <path d="M22.5 6.5a13.4 13.4 0 010 19" opacity=".35" />
      <path d="M18.5 10.5a7.7 7.7 0 010 11" opacity=".6" />
      <path d="M4 16h9" />
      <path d="M8.5 11.5L4 16l4.5 4.5" />
      <circle cx="14.5" cy="16" r="2.4" {...POINT} />
    </svg>
  );
}

function Compose() {
  return (
    <svg {...BASE} className="glyph">
      <path d="M5 8h14" />
      <path d="M5 14h18" opacity=".6" />
      <path d="M5 20h10" opacity=".35" />
      <path d="M5 26h6" opacity=".2" />
      <path d="M25.5 19.5v8" opacity=".35" />
      <circle cx="25.5" cy="8" r="2.4" {...POINT} />
      <path d="M25.5 12v4" />
    </svg>
  );
}

function Frame() {
  return (
    <svg {...BASE} className="glyph">
      <rect x="4.5" y="6.5" width="23" height="19" rx="1.5" opacity=".35" />
      <path d="M4.5 12h23" opacity=".35" />
      <path d="M9 17h9" />
      <path d="M9 21h5.5" opacity=".6" />
      <circle cx="22.5" cy="19.5" r="2.4" {...POINT} />
    </svg>
  );
}

function Network() {
  return (
    <svg {...BASE} className="glyph">
      <path d="M8 9.5l8.5 6.5L8 22.5" opacity=".6" />
      <path d="M16.5 16h6" />
      <circle cx="7" cy="8" r="2" />
      <circle cx="7" cy="24" r="2" />
      <circle cx="16.5" cy="16" r="2" opacity=".6" />
      <circle cx="25" cy="16" r="2.6" {...POINT} />
    </svg>
  );
}

const GLYPHS: Record<ServiceGlyph, () => JSX.Element> = {
  trajectory: Trajectory,
  reach: Reach,
  compose: Compose,
  frame: Frame,
  network: Network,
};

export function ServiceIcon({ name }: { name: ServiceGlyph }) {
  const Glyph = GLYPHS[name];
  return <Glyph />;
}

/** Direction-aware arrow for buttons; RTL flips it via CSS, not markup. */
export function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="btn__arrow"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12.5 8H3.5" />
      <path d="M7 3.5L3.5 8 7 12.5" />
    </svg>
  );
}
