import type {LoaderVariants} from "./loader.styles";
import type {CSSProperties, ReactNode} from "react";

/* -------------------------------------------------------------------------------------------------
 * Loader drawings
 * -------------------------------------------------------------------------------------------------
 * Every variant is a small SVG whose parts are animated from loader.css. The geometry below is
 * static per variant, so each drawing is built once and cached. Parts that the CSS animates carry a
 * `--_index` (stagger) or per-part custom properties; the SVG attributes (opacity, transform, ...)
 * describe the still frame that remains when reduced motion turns the animations off.
 * -----------------------------------------------------------------------------------------------*/
export type LoaderVariant = NonNullable<LoaderVariants["variant"]>;

export type LoaderDrawing = {
  content: ReactNode;
  viewBox: string;
};

const TAU = Math.PI * 2;

/** Rounds to `digits` decimals and drops trailing zeros (and `-0`). */
const fmt = (value: number, digits = 3) => String(Number(value.toFixed(digits)) || 0);

const vars = (values: Record<string, number | string>) => values as CSSProperties;

const range = (length: number) => Array.from({length}, (_, index) => index);

const frac = (value: number) => ((value % 1) + 1) % 1;

/* ------------------------------------------------------------------------------------------------
 * ring: a quarter arc over a faint track, the whole SVG spins
 * ------------------------------------------------------------------------------------------------ */
const ring = (): LoaderDrawing => ({
  content: (
    <g fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle className="loader__track" cx="12" cy="12" r="10" />
      <path className="loader__ring-arc" d="M22 12A10 10 0 0 1 11.71 22" strokeLinecap="round" />
    </g>
  ),
  viewBox: "0 0 24 24",
});

/* ------------------------------------------------------------------------------------------------
 * classic: 12 radial bars fading one after another
 * ------------------------------------------------------------------------------------------------ */
const classic = (): LoaderDrawing => ({
  content: (
    <g fill="currentColor">
      {range(12).map((index) => (
        <rect
          key={index}
          className="loader__classic-bar"
          height="1.92"
          rx="0.96"
          style={vars({"--_index": index})}
          transform={`rotate(${index * 30})`}
          width="5.76"
          x="6.02"
          y="-0.96"
        />
      ))}
    </g>
  ),
  viewBox: "-12 -12 24 24",
});

/* ------------------------------------------------------------------------------------------------
 * dots: three bouncing dots (radius and position come from CSS)
 * ------------------------------------------------------------------------------------------------ */
const dots = (): LoaderDrawing => ({
  content: (
    <g fill="currentColor">
      {range(3).map((index) => (
        <circle
          key={index}
          className="loader__dots-dot"
          cy="12"
          opacity="0.7"
          style={vars({"--_index": index})}
        />
      ))}
    </g>
  ),
  viewBox: "0 0 24 24",
});

/* ------------------------------------------------------------------------------------------------
 * pulse: one breathing dot
 * ------------------------------------------------------------------------------------------------ */
const pulse = (): LoaderDrawing => ({
  content: (
    <circle
      className="loader__pulse-dot"
      cx="12"
      cy="12"
      fill="currentColor"
      opacity="0.7"
      r="4.8"
    />
  ),
  viewBox: "0 0 24 24",
});

/* ------------------------------------------------------------------------------------------------
 * scan: a line sweeping up and down inside a rounded frame
 * ------------------------------------------------------------------------------------------------ */
const scan = (): LoaderDrawing => ({
  content: (
    <g fill="none" stroke="currentColor">
      <rect className="loader__track" height="18" strokeWidth="2" width="18" x="3" y="3" />
      <path
        className="loader__scan-line"
        d="M7.5 12L16.5 12"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
    </g>
  ),
  viewBox: "0 0 24 24",
});

/* ------------------------------------------------------------------------------------------------
 * grid: 3x3 cells, a diagonal wave runs from the top-left corner
 * ------------------------------------------------------------------------------------------------ */
const GRID_OPACITY = [1, 0.85, 0.55, 0.3, 0.15];

const grid = (): LoaderDrawing => ({
  content: (
    <g fill="currentColor">
      {range(9).map((cell) => {
        const row = Math.floor(cell / 3);
        const column = cell % 3;
        const index = row + column;

        return (
          <rect
            key={cell}
            className="loader__grid-cell"
            height="4"
            opacity={GRID_OPACITY[index]}
            style={vars({"--_index": index})}
            width="4"
            x={column * 6}
            y={row * 6}
          />
        );
      })}
    </g>
  ),
  viewBox: "0 0 16 16",
});

/* ------------------------------------------------------------------------------------------------
 * shuffle: three tiles taking turns around a 2x2 grid
 * ------------------------------------------------------------------------------------------------ */
const SHUFFLE_TILES = [
  {opacity: 0.4, x: 0, y: 0},
  {opacity: 0.4, x: 11, y: 0},
  {opacity: 1, x: 11, y: 11},
];

const shuffle = (): LoaderDrawing => ({
  content: (
    <g fill="currentColor">
      {SHUFFLE_TILES.map((tile, index) => (
        <rect
          key={index}
          className="loader__shuffle-tile"
          height="9"
          opacity={tile.opacity}
          style={vars({"--_index": index, "--_rest": `${tile.x}px, ${tile.y}px`})}
          width="9"
          x="2"
          y="2"
        />
      ))}
    </g>
  ),
  viewBox: "0 0 24 24",
});

/* ------------------------------------------------------------------------------------------------
 * wave: five equaliser bars (the resting ramp comes from CSS)
 * ------------------------------------------------------------------------------------------------ */
const wave = (): LoaderDrawing => ({
  content: (
    <g fill="currentColor">
      {range(5).map((index) => (
        <rect
          key={index}
          className="loader__wave-bar"
          height="24"
          rx="1.2"
          style={vars({"--_index": index})}
          width="2.4"
          x={fmt(index * 5.4, 2)}
          y="0"
        />
      ))}
    </g>
  ),
  viewBox: "0 0 24 24",
});

/* ------------------------------------------------------------------------------------------------
 * sparkle: five four-pointed stars twinkling in turn
 * ------------------------------------------------------------------------------------------------ */
// [centre x, centre y, outer radius] in a 21 x 21 box
const SPARKLE_STARS: Array<[number, number, number]> = [
  [10.5, 9.66, 7],
  [3.78, 4.62, 3.85],
  [17.22, 5.46, 3.15],
  [16.38, 15.96, 3.85],
  [4.62, 16.38, 2.8],
];

/** A four-pointed star made of four concave cubic curves between its tips. */
const starPath = (cx: number, cy: number, radius: number) => {
  const near = radius / 12;
  const far = (radius * 5) / 12;
  const p = (x: number, y: number) => `${fmt(x, 2)} ${fmt(y, 2)}`;

  return [
    `M${p(cx, cy - radius)}`,
    `C${p(cx + near, cy - far)} ${p(cx + far, cy - near)} ${p(cx + radius, cy)}`,
    `C${p(cx + far, cy + near)} ${p(cx + near, cy + far)} ${p(cx, cy + radius)}`,
    `C${p(cx - near, cy + far)} ${p(cx - far, cy + near)} ${p(cx - radius, cy)}`,
    `C${p(cx - far, cy - near)} ${p(cx - near, cy - far)} ${p(cx, cy - radius)}Z`,
  ].join("");
};

const sparkle = (): LoaderDrawing => ({
  content: (
    <g fill="currentColor">
      {SPARKLE_STARS.map(([cx, cy, radius], index) => (
        <path
          key={index}
          className="loader__sparkle-star"
          d={starPath(cx, cy, radius)}
          opacity="0.525"
          style={vars({"--_index": index})}
        />
      ))}
    </g>
  ),
  viewBox: "0 0 21 21",
});

/* ------------------------------------------------------------------------------------------------
 * atom: a nucleus ring with three tilted orbits flipping in turn
 * ------------------------------------------------------------------------------------------------ */
const ATOM_ORBITS = [90, -30, 30];

const atom = (): LoaderDrawing => ({
  content: (
    <g fill="none" stroke="currentColor" strokeWidth="0.8">
      <circle cx="8" cy="8" r="7.6" />
      {ATOM_ORBITS.map((angle, index) => (
        <g key={index} transform={`rotate(${angle} 8 8)`}>
          <circle
            className="loader__atom-ring"
            cx="8"
            cy="8"
            r="7.6"
            style={vars({"--_index": index})}
          />
        </g>
      ))}
    </g>
  ),
  viewBox: "0 0 16 16",
});

/* ------------------------------------------------------------------------------------------------
 * morph: 18 dots morphing circle -> triangle -> square
 * ------------------------------------------------------------------------------------------------ */
const MORPH = {
  center: 8,
  count: 18,
  dotRadius: 0.68,
  radius: 5.67,
  squareHalf: 4.72,
  // Top, bottom-right and bottom-left corners; each side carries a sixth of the dots.
  triangle: [
    [8, 2.78],
    [13.65, 12.655],
    [2.35, 12.655],
  ] as Array<[number, number]>,
};

/** Point `index` of `count` evenly spaced along a square's outline, clockwise from top centre. */
const squarePoint = (index: number): [number, number] => {
  const {center, count, squareHalf: half} = MORPH;
  let distance = (index * half * 8) / count;
  // Walk the outline: half the top edge, then the right, bottom and left edges.
  const legs: Array<[number, number, number, number]> = [
    [center, center - half, 1, 0],
    [center + half, center - half, 0, 1],
    [center + half, center + half, -1, 0],
    [center - half, center + half, 0, -1],
    [center - half, center - half, 1, 0],
  ];
  const lengths = [half, half * 2, half * 2, half * 2, half];

  for (let leg = 0; leg < legs.length; leg++) {
    const [x, y, dx, dy] = legs[leg]!;

    if (distance <= lengths[leg]! || leg === legs.length - 1) {
      return [x + dx * distance, y + dy * distance];
    }
    distance -= lengths[leg]!;
  }

  return [center, center - half];
};

const trianglePoint = (index: number): [number, number] => {
  const perSide = MORPH.count / 3;
  const side = Math.floor(index / perSide);
  const t = (index % perSide) / perSide;
  const [x1, y1] = MORPH.triangle[side]!;
  const [x2, y2] = MORPH.triangle[(side + 1) % 3]!;

  return [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
};

const morph = (): LoaderDrawing => {
  const {center, count, dotRadius, radius} = MORPH;
  // Two decimals like the observed markup, without a "-0.00" for values that round to zero.
  const px = (value: number) => (Math.abs(value) < 0.005 ? 0 : value).toFixed(2);
  const offset = (x: number, y: number) => `${px(x)}px, ${px(y)}px`;

  return {
    content: (
      <g className="loader__morph-dots" fill="currentColor">
        {range(count).map((index) => {
          const angle = (index / count) * TAU;
          const x = center + radius * Math.sin(angle);
          const y = center - radius * Math.cos(angle);
          const [sx, sy] = squarePoint(index);
          const [tx, ty] = trianglePoint(index);

          return (
            <circle
              key={index}
              className="loader__morph-dot"
              cx={fmt(x)}
              cy={fmt(y)}
              r={dotRadius}
              style={vars({
                "--_square": offset(sx - x, sy - y),
                "--_triangle": offset(tx - x, ty - y),
              })}
            />
          );
        })}
      </g>
    ),
    viewBox: "0 0 16 16",
  };
};

/* ------------------------------------------------------------------------------------------------
 * helix: three strands orbiting a vertical axis in front of a faint ghost column
 * ------------------------------------------------------------------------------------------------
 * Each row is a horizontal ellipse (half width `halfWidth * envelope`), drawn as a unit circle
 * scaled by that width. Dots orbit it (`.loader__helix-orbit`, translateX -1 -> 1) while the depth
 * animation (`.loader__helix-dot`) lifts, grows and brightens them in front and does the opposite
 * at the back. Strand dots also breathe radially (`.loader__helix-weave`).
 */
const HELIX = {
  centerY: 10,
  ghostHalfHeight: 41 / 6,
  ghostRadius: 0.3,
  ghostRows: 17,
  halfHeight: 7.2604,
  halfWidth: 7.6,
  lift: 0.2955,
  period: 5712,
  strandRowStep: 2.3234,
  strandRowTop: 16.594,
  strandRows: 6,
  strands: 3,
};

// Ghost column [near opacity, far opacity] per row, top to bottom.
const HELIX_GHOST_LIGHT: Array<[number, number]> = [
  [0.061, 0.045],
  [0.065, 0.039],
  [0.068, 0.035],
  [0.069, 0.032],
  [0.07, 0.029],
  [0.07, 0.027],
  [0.07, 0.025],
  [0.07, 0.024],
  [0.069, 0.023],
  [0.068, 0.022],
  [0.067, 0.022],
  [0.065, 0.022],
  [0.063, 0.022],
  [0.061, 0.023],
  [0.058, 0.025],
  [0.053, 0.027],
  [0.047, 0.032],
];

// Strand rows [near opacity, far opacity, depth scale amount] from the bottom row up.
const HELIX_STRAND_LIGHT: Array<[number, number, number]> = [
  [0.493, 0.261, 0.194],
  [0.72, 0.215, 0.358],
  [0.826, 0.203, 0.408],
  [0.886, 0.217, 0.406],
  [0.898, 0.256, 0.363],
  [0.851, 0.335, 0.272],
];

const helixWidth = (y: number) => {
  const dy = (y - HELIX.centerY) / HELIX.halfHeight;

  return HELIX.halfWidth * Math.sqrt(Math.max(0, 1 - dy * dy));
};

type HelixDotOptions = {
  far: number;
  farScale: number;
  key: string;
  near: number;
  nearScale: number;
  phase: number;
  radius: number;
  y: number;
};

const helixDot = ({far, farScale, key, near, nearScale, phase, radius, y}: HelixDotOptions) => {
  const {lift, period} = HELIX;
  const width = helixWidth(y);
  const orbitDelay = -Math.round(phase * period);
  // The depth cycle starts in front (a quarter turn after the orbit's left edge).
  let depthDelay = orbitDelay + period / 4;

  if (depthDelay > 0) depthDelay -= period;

  // Still frame at t = 0: x = -cos, depth = sin of the orbit angle.
  const angle = (-orbitDelay / period) * TAU;
  const depth = Math.sin(angle);
  const mid = (near + far) / 2;
  const midScale = (nearScale + farScale) / 2;

  return (
    <g key={key} transform={`translate(10 ${fmt(y)}) scale(${fmt(width)})`}>
      <g
        className="loader__helix-orbit"
        style={{animationDelay: `${orbitDelay}ms`}}
        transform={`translate(${fmt(-Math.cos(angle), 4)} 0)`}
      >
        <circle
          className="loader__helix-dot"
          opacity={fmt(mid + (near - mid) * depth, 4)}
          r={fmt(radius / width, 5)}
          transform={`translate(0 ${fmt(lift * depth, 4)}) scale(${fmt(midScale + (nearScale - midScale) * depth, 4)})`}
          style={vars({
            "--_far-opacity": far,
            "--_far-scale": fmt(farScale),
            "--_near-opacity": near,
            "--_near-scale": fmt(nearScale),
            animationDelay: `${depthDelay}ms`,
          })}
        />
      </g>
    </g>
  );
};

const helix = (): LoaderDrawing => {
  const {centerY, ghostHalfHeight, ghostRows, period, strandRowStep, strandRowTop} = HELIX;
  const ghostStep = (ghostHalfHeight * 2) / (ghostRows - 1);
  // Ghost dots are spread around the orbit by the golden angle so they never line up.
  const golden = 0.381964;

  const ghosts = HELIX_GHOST_LIGHT.map(([near, far], row) =>
    helixDot({
      far,
      farScale: 1,
      key: `ghost-${row}`,
      near,
      nearScale: 1,
      phase: frac(0.538175 - row * golden),
      radius: HELIX.ghostRadius,
      y: centerY - ghostHalfHeight + row * ghostStep,
    }),
  );

  const strands = range(HELIX.strands).flatMap((strand) =>
    HELIX_STRAND_LIGHT.map(([near, far, amount], row) => {
      // Consecutive rows sit almost half a turn apart, so each strand zig-zags around the axis.
      const phase = frac(0.900432 - row * 0.48 - strand / 3);
      const weavePhase = frac(0.601884 - row * 0.04 - strand / 3);
      const weaveDelay = -Math.round(weavePhase * (period / 2));

      return (
        <g
          key={`strand-${strand}-${row}`}
          className="loader__helix-weave"
          style={{animationDelay: `${weaveDelay}ms`}}
          transform={`scale(${fmt(1 - 0.075 * Math.cos(weavePhase * TAU), 4)})`}
        >
          {helixDot({
            far,
            farScale: 1 - amount,
            key: "dot",
            near,
            nearScale: 1 + amount,
            phase,
            radius: 0.498 + row * 0.0228,
            y: strandRowTop - row * strandRowStep,
          })}
        </g>
      );
    }),
  );

  return {
    content: (
      <g fill="currentColor" style={vars({"--_lift": `${HELIX.lift}px`})}>
        {ghosts}
        {strands}
      </g>
    ),
    viewBox: "0 0 20 20",
  };
};

/* ------------------------------------------------------------------------------------------------
 * twist: a dotted sphere whose latitude slabs turn a quarter turn one after another
 * ------------------------------------------------------------------------------------------------
 * The sphere is seen from slightly above: every slab is a horizontal ring squashed vertically by
 * `squash`, and the dots are un-squashed again so they stay round. Dot size and opacity follow the
 * dot's depth towards the viewer; `--_turned-*` are the values at the slab's quarter-turned pose.
 */
const TWIST = {
  // Angle of the first dot of every ring (clockwise, SVG coordinates).
  phase: (71.09 * Math.PI) / 180,
  radius: 8.2,
  slabs: [
    {count: 1, latitude: -90},
    {count: 8, latitude: -45},
    {count: 12, latitude: 0},
    {count: 8, latitude: 45},
    {count: 1, latitude: 90},
  ],
  squash: 0.34294,
};

const twist = (): LoaderDrawing => {
  const {phase, radius, slabs, squash} = TWIST;
  const tilt = Math.cos(Math.asin(squash));
  const depthOf = (y: number, height: number) => (y * tilt + height * squash) / radius;
  const radiusOf = (depth: number) => 0.5426 + 0.318 * depth;
  const opacityOf = (depth: number) => 0.65 + 0.27 * depth;
  const opacityVars = (prefix: string, opacity: number) => ({
    [`--_${prefix}opacity`]: fmt(opacity),
    [`--_${prefix}rest-opacity`]: fmt(opacity * 0.86),
    [`--_${prefix}settle-opacity`]: fmt(opacity * 0.8645),
  });

  return {
    content: (
      <g fill="currentColor" style={vars({"--_unsquash": fmt(1 / squash)})}>
        {slabs.map(({count, latitude}, index) => {
          const lat = (latitude * Math.PI) / 180;
          const height = radius * Math.sin(lat);
          const ring = radius * Math.cos(lat);

          return (
            <g
              key={index}
              style={vars({"--_index": index})}
              transform={`translate(10 ${fmt(10 - height * tilt)}) scale(1 ${fmt(squash)})`}
            >
              <g className="loader__twist-slab">
                {range(count).map((dot) => {
                  const angle = phase - (dot / count) * TAU;
                  const x = count === 1 ? 0 : ring * Math.cos(angle);
                  const y = count === 1 ? 0 : ring * Math.sin(angle);
                  // A quarter turn clockwise maps (x, y) to (-y, x).
                  const depth = depthOf(y, height);
                  const turnedDepth = depthOf(x, height);
                  const size = radiusOf(depth);

                  return (
                    <g key={dot} transform={`translate(${fmt(x)} ${fmt(y)})`}>
                      <circle
                        className="loader__twist-dot"
                        r={fmt(size)}
                        style={vars({
                          ...opacityVars("", opacityOf(depth)),
                          ...opacityVars("turned-", opacityOf(turnedDepth)),
                          "--_turned-scale": fmt(radiusOf(turnedDepth) / size),
                        })}
                      />
                    </g>
                  );
                })}
              </g>
            </g>
          );
        })}
      </g>
    ),
    viewBox: "0 0 20 20",
  };
};

/* ------------------------------------------------------------------------------------------------
 * infinity: a comet tracing a figure eight (1.5x wide)
 * ------------------------------------------------------------------------------------------------
 * The comet is six short capsules; each one follows the curve through two independent
 * translations (x and y) plus a rotation that keeps it tangent. The still frame lays the capsules
 * end to end along the curve, starting at the crossing point.
 */
const INFINITY_COMETS: Array<[number, number, number]> = [
  [28.51, 13.22, -56.83],
  [29.63, 11.75, -48.57],
  [30.95, 10.45, -40.41],
  [32.44, 9.36, -32.42],
  [34.07, 8.47, -24.55],
  [35.8, 7.82, -16.67],
];

const infinity = (): LoaderDrawing => ({
  content: (
    <g fill="none" stroke="currentColor" strokeWidth="2.75">
      <path
        className="loader__track"
        d="M28 14C33 5 47 5 47 14C47 23 33 23 28 14C23 5 9 5 9 14C9 23 23 23 28 14Z"
      />
      {INFINITY_COMETS.map(([x, y, angle], index) => (
        <g key={index} className="loader__infinity-x" style={vars({"--_index": index})}>
          <g className="loader__infinity-y">
            <line
              className="loader__infinity-comet"
              strokeLinecap="round"
              transform={`translate(${x} ${y}) rotate(${angle})`}
              x1="-0.93"
              x2="0.93"
            />
          </g>
        </g>
      ))}
    </g>
  ),
  viewBox: "7 0 42 28",
});

/* ------------------------------------------------------------------------------------------------
 * Registry
 * ------------------------------------------------------------------------------------------------ */
const BUILDERS: Record<LoaderVariant, () => LoaderDrawing> = {
  atom,
  classic,
  dots,
  grid,
  helix,
  infinity,
  morph,
  pulse,
  ring,
  scan,
  shuffle,
  sparkle,
  twist,
  wave,
};

const cache = new Map<LoaderVariant, LoaderDrawing>();

/** Returns the (cached) default drawing of a variant. Unknown variants fall back to `ring`. */
export function getLoaderDrawing(variant: LoaderVariant = "ring"): LoaderDrawing {
  const key: LoaderVariant = variant in BUILDERS ? variant : "ring";
  let drawing = cache.get(key);

  if (!drawing) {
    drawing = BUILDERS[key]();
    cache.set(key, drawing);
  }

  return drawing;
}

export const LOADER_VARIANTS = Object.keys(BUILDERS) as LoaderVariant[];
