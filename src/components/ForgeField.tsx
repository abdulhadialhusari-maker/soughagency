/**
 * ForgeField — the original brand motif for «الصياغة والتحول والنمو».
 *
 * One reading, right to left, in Arabic reading order and in step with the
 * approved brand motion contract (noise on the right, clarity on the left, the
 * cobalt point last):
 *
 *   scattered marks on an open field  →  the marks fall onto one rising path
 *   →  the path resolves into a single line  →  a cobalt point completes it,
 *   and growth rings open outward from it.
 *
 * Pure inline SVG on a fixed 600×640 grid: no library, no raster, no WebGL, and
 * nothing that can shift layout. Every animated element's base state is its
 * final state, so with motion reduced or JS absent the drawing is complete.
 */

const GRID_X = [60, 140, 220, 300, 380, 460, 540];
const GRID_Y = [80, 160, 240, 320, 400, 480, 560];

/** raw marks — deliberately irregular, densest at the far right */
const NOISE: ReadonlyArray<readonly [number, number, number]> = [
  [566, 384, 3.4],
  [530, 350, 2.2],
  [575, 442, 2.6],
  [512, 412, 3],
  [548, 470, 2],
  [500, 486, 3.2],
  [576, 512, 2.4],
  [528, 544, 2.8],
  [478, 448, 2.2],
  [466, 528, 3],
  [582, 578, 2.2],
  [504, 578, 2.6],
  [440, 500, 2],
  [452, 574, 2.4],
];

/** short slashes: the marks that have started to align but not yet landed */
const DRIFT: ReadonlyArray<readonly [number, number, number, number]> = [
  [498, 344, 520, 330],
  [452, 396, 476, 380],
  [412, 356, 438, 342],
  [470, 300, 494, 288],
];

/** nodes sitting exactly on the resolved path */
const NODES: ReadonlyArray<readonly [number, number]> = [
  [414, 456],
  [300, 312],
  [200, 240],
];

const PATH =
  "M 556 534 C 492 520 452 494 414 456 C 372 414 344 360 300 312 C 250 258 190 214 120 186";

export function ForgeField({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 640"
      className={className ? `forge ${className}` : "forge"}
      role="img"
      aria-label="من معطيات متفرقة إلى مسار نمو واضح"
      preserveAspectRatio="xMidYMid meet"
    >
      <title>من معطيات متفرقة إلى مسار نمو واضح</title>

      <g className="forge__grid" aria-hidden="true">
        {GRID_X.map((x) => (
          <line key={`x${x}`} x1={x} y1="48" x2={x} y2="592" />
        ))}
        {GRID_Y.map((y) => (
          <line key={`y${y}`} x1="40" y1={y} x2="576" y2={y} />
        ))}
      </g>

      {/* measure ticks — the field is a working surface, not a canvas */}
      <g className="forge__ticks" aria-hidden="true">
        {GRID_X.map((x) => (
          <line key={`tx${x}`} x1={x} y1="600" x2={x} y2="608" />
        ))}
        <line x1="40" y1="604" x2="576" y2="604" />
      </g>

      <g className="forge__noise" aria-hidden="true">
        {NOISE.map(([cx, cy, r]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
        ))}
      </g>

      <g className="forge__drift" aria-hidden="true">
        {DRIFT.map(([x1, y1, x2, y2]) => (
          <line key={`${x1}-${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
      </g>

      {/* the resolved path: one continuous line out of the scatter */}
      <path className="forge__path" d={PATH} pathLength={1} aria-hidden="true" />

      <g className="forge__nodes" aria-hidden="true">
        {NODES.map(([cx, cy], i) => (
          <circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r="5"
            style={{ "--node-i": i } as React.CSSProperties}
          />
        ))}
      </g>

      {/* growth rings open from the point of completion */}
      <g className="forge__rings" aria-hidden="true">
        <circle cx="120" cy="186" r="34" style={{ "--ring-i": 0 } as React.CSSProperties} />
        <circle cx="120" cy="186" r="60" style={{ "--ring-i": 1 } as React.CSSProperties} />
        <circle cx="120" cy="186" r="88" style={{ "--ring-i": 2 } as React.CSSProperties} />
      </g>

      <circle className="forge__point" cx="120" cy="186" r="11" aria-hidden="true" />
    </svg>
  );
}
