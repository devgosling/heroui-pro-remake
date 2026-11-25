import type {SVGProps} from "react";

type IconProps = SVGProps<SVGSVGElement>;

/**
 * Compass needle: a north half (two red facets) and a south half (two muted facets). The
 * `data-needle` facets are coloured from CSS (`.map__compass-icon [data-needle=...]`).
 */
export const MapCompassIcon = (props: IconProps) => (
  <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>
    <path d="M12 2 16 12h-4z" data-needle="north-right" />
    <path d="M12 2 8 12h4z" data-needle="north-left" />
    <path d="M12 22 16 12h-4z" data-needle="south-right" />
    <path d="M12 22 8 12h4z" data-needle="south-left" />
  </svg>
);

/** Crosshair with a center dot (locate control). */
export const MapLocateIcon = (props: IconProps) => (
  <svg aria-hidden="true" fill="none" viewBox="0 0 16 16" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeWidth={1.5}>
      <circle cx={8} cy={8} r={4.75} />
      <path d="M8 1.75v1.5M8 12.75v1.5M1.75 8h1.5M12.75 8h1.5" />
    </g>
    <circle cx={8} cy={8} fill="currentColor" r={1.75} />
  </svg>
);

/** Four corner arrows pointing outwards (fullscreen control). */
export const MapFullscreenIcon = (props: IconProps) => (
  <svg aria-hidden="true" fill="none" viewBox="0 0 16 16" {...props}>
    <path
      d="M2.5 5.5v-3h3M2.75 2.75 6 6M13.5 5.5v-3h-3M13.25 2.75 10 6M2.5 10.5v3h3M2.75 13.25 6 10M13.5 10.5v3h-3M13.25 13.25 10 10"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
    />
  </svg>
);

/** Four corner arrows pointing inwards (exit fullscreen). */
export const MapExitFullscreenIcon = (props: IconProps) => (
  <svg aria-hidden="true" fill="none" viewBox="0 0 16 16" {...props}>
    <path
      d="M5.5 2.5v3h-3M5.25 5.25l-3-3M10.5 2.5v3h3M10.75 5.25l3-3M5.5 13.5v-3h-3M5.25 10.75l-3 3M10.5 13.5v-3h3M10.75 10.75l3 3"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
    />
  </svg>
);
